# Plan complet — (A) Aura realtime → reactive (Phase 1) + (B) Refonte docs → skills

> **Pour l'agent qui implémente :** ce plan contient des **bouts de code illustratifs** (signatures, structures clés) et **toutes les références de fichiers**, pas le code complet. Tu écris le code final en suivant les patterns existants. Lance `bun x tsc --noEmit --project packages/aura/tsconfig.json` et `... apps/app/tsconfig.json` après chaque lot.

---

# Context

Aura fait du **realtime pub/sub coarse**, pas du **reactive**. Après mutation, `runner.ts:138-144` diffuse à **tous** les clients une liste de **noms d'entités** que le dev déclare à la main via `.entities([...])`. Chaque client refetch toute query observant l'entité. Problèmes : sur-invalidation (toute vue Todo refetch pour un seul Todo modifié), fuite à tous les clients, déclaration manuelle, round-trip refetch.

Convex (clone étudié dans `/tmp/convex-backend`) est **reactive** : chaque query enregistre son *read-set* (`crates/database/src/reads.rs`), les writes sont matchés contre les read-sets (`crates/interval_map`, treap O(log n+k)), seules les souscriptions touchées sont notifiées (`crates/sync`). On porte **3 idées** sans la machinerie MVCC : read-set auto-tracké, write-set auto-tracké, routage par souscription.

**Décisions actées :**
- **Phase 1** : auto-tracking + routage par client, on **garde le refetch TanStack** (le push+diff server-side = Phase 2 future).
- **Granularité instance + table** : `Todo:<id>` pour lectures/écritures ciblées, `Todo` pour listes/agrégats.
- **Remplacement complet** des API manuelles `.entities([...])` et `ctx.invalidate(...)`. Escape hatch `ctx.track(...)` conservé pour l'intraçable (`$queryRaw`, actions sans DB).
- **Docs → skills** : suite complète de skills `.claude/skills/` + `AGENTS.md` mince qui pointe vers eux ; suppression des docs de session.

---

# PARTIE A — Implémentation realtime → reactive (Phase 1)

## Modèle de clés (dérivé automatiquement)

| Méthode Prisma (lecture) | Read-keys |
|---|---|
| `findUnique/findUniqueOrThrow({where:{id}})` | `Model:<id>` |
| `findFirst/findFirstOrThrow` | `Model` + (si row retourné) `Model:<id>` |
| `findMany` | `Model` + `Model:<id>` pour chaque row retourné |
| `count/aggregate/groupBy` | `Model` |

| Méthode Prisma (écriture) | Write-keys |
|---|---|
| `create` | `Model` + `Model:<newId>` (id du résultat) |
| `update/upsert/delete({where:{id}})` | `Model` + `Model:<id>` |
| `createMany/updateMany/deleteMany` | `Model` |

Nom de clé = modèle en **PascalCase** (délégué `auraUser` → `AuraUser`), aligné sur les noms de modèles Prisma.
Matching (invalidation) : `hit = writeKeys.some(k => readKeys.has(k))`. Une write-key table (`Model`) matche toute query lisant ce modèle ; `Model:<id>` ne matche que les queries lisant ce row (ou la table).

---

## A1. NOUVEAU `packages/aura/src/server/db-tracked.ts`

Proxy Prisma jumeau de `db-readonly.ts:wrapDelegate` (même détection délégué `/^[a-z]/`, lignes 99-104), mais qui **observe** les méthodes au lieu de les bloquer.

```ts
export interface TrackSink {
  addRead(key: string): void;
  addWrite(key: string): void;
}

const READ_METHODS = new Set([ /* idem db-readonly.ts:27-36 */ ]);
const WRITE_BY_ID = new Set(["update", "upsert", "delete"]);
const WRITE_TABLE = new Set(["createMany", "updateMany", "deleteMany"]);

function pascal(model: string): string {
  return model.charAt(0).toUpperCase() + model.slice(1);
}

// Wrappe une méthode délégué : exécute, puis dérive les clés depuis args + résultat.
function trackMethod(model: string, method: string, fn: Function, sink: TrackSink) {
  return async (args: any) => {
    const result = await fn(args);
    const M = pascal(model);
    if (READ_METHODS.has(method)) {
      if (method.startsWith("findUnique")) {
        if (args?.where?.id) sink.addRead(`${M}:${args.where.id}`);
        else sink.addRead(M);
      } else if (method === "count" || method === "aggregate" || method === "groupBy") {
        sink.addRead(M);
      } else { // findFirst / findMany
        sink.addRead(M);
        for (const row of toRows(result)) if (row?.id) sink.addRead(`${M}:${row.id}`);
      }
    } else if (WRITE_BY_ID.has(method)) {
      sink.addWrite(M);
      const id = args?.where?.id ?? (result as any)?.id;
      if (id) sink.addWrite(`${M}:${id}`);
    } else if (method === "create") {
      sink.addWrite(M);
      if ((result as any)?.id) sink.addWrite(`${M}:${(result as any).id}`);
    } else if (WRITE_TABLE.has(method)) {
      sink.addWrite(M);
    }
    return result;
  };
}

export function createTrackedDb(client: PrismaClient, sink: TrackSink): PrismaClient { /* Proxy top-level + wrapDelegate, comme db-readonly.ts:84-107 */ }
```

- `toRows(result)` : normalise tableau vs objet unique.
- **Important** : exporter `READ_METHODS` depuis CE module et le ré-importer dans `db-readonly.ts` (single source of truth — actuellement dupliqué à `db-readonly.ts:27`).
- Refs : copier la structure exacte du double-Proxy de `db-readonly.ts:61-107`.

## A2. `packages/aura/src/server/create-context.ts`

- Remplacer `const invalidatedEntities = new Set<string>()` (ligne 160) par :
```ts
const readKeys = new Set<string>();
const writeKeys = new Set<string>();
const sink: TrackSink = { addRead: (k) => readKeys.add(k), addWrite: (k) => writeKeys.add(k) };
```
- `ctx.db` : exposer `createTrackedDb(db, sink)` (le wrap read-only s'ajoute par-dessus côté runner, voir A3).
- **Supprimer** `ctx.invalidate` (lignes 243-253) et `invalidatedEntities` (ligne 254). Ajouter :
```ts
track(input: { read?: string[]; write?: string[] }) {
  input.read?.forEach((k) => readKeys.add(k));
  input.write?.forEach((k) => writeKeys.add(k));
},
readKeys,
writeKeys,
```
- `runOperation` interne (lignes 127-155) : **supprimer** la boucle `for (const tag of operation.entities)` (lignes 148-152). La propagation nested est désormais automatique (le tracked-db partage le même `sink`). Garde le reste.

## A3. `packages/aura/src/server/context.ts`

- Retirer `invalidate(...)` (lignes 136-141) et `invalidatedEntities` (lignes 142-143).
- Ajouter au type `AuraContext` :
```ts
track(input: { read?: string[]; write?: string[] }): void;
readKeys: Set<string>;
writeKeys: Set<string>;
```

## A4. `packages/aura/src/server/runner.ts`

- `withTypedDb` (lignes 215-233) : pour une **query**, composer read-only + tracked. Le `ctx.db` est déjà tracked (A2), donc :
```ts
if (type === "query") return { ...ctx, db: createReadOnlyDb(ctx.db) };
```
(read-only enveloppe le tracked — les deux Proxy se composent : read-only laisse passer les `READ_METHODS`, tracked les observe.) Mutations : `ctx.db` tel quel (déjà tracked). Actions : tombstone inchangé (lignes 219-230).
- Bloc invalidation (lignes 135-144) → :
```ts
const isMutating = opType === "mutate" || opType === "action";
const writeKeys = isMutating ? [...ctx.writeKeys] : [];
if (isMutating && writeKeys.length > 0) void publishInvalidation(writeKeys);
```
- `successEnvelope({...})` (lignes 147-158) : ajouter `readKeys: [...ctx.readKeys]`, et `invalidates: writeKeys` (on garde le nom de champ `invalidates`).

## A5. `packages/aura/src/core/envelope.ts`

- `AuraSuccessEnvelope.meta` (lignes 14-19) + `successEnvelope` args (lignes 35-50) : ajouter `readKeys: string[]`.
- Pour les mutations `readKeys: []`.

## A6. `packages/aura/src/client/hooks.ts` + `transport.ts`

- `transport.ts` (`callAuraOperationWithMeta`, ligne 62-70) : exposer `meta.readKeys`.
- `useQuery` (lignes 74-98) : **supprimer** `const entities = getOperationEntities(...)` (ligne 81) et `meta: { entities }` (ligne 96). À la place, écrire les readKeys du fetch dans la query meta APRÈS résolution :
```ts
queryFn: async ({ signal }) => {
  const result = await callAuraOperationWithMeta({ operationName, input, params, signal });
  // stocke les readKeys dynamiques pour le matching realtime
  queryClient.setQueryDefaults(...) // ou via meta mutable — voir note
  if (showBumps) displayAuraBumps(result.meta.bumps);
  return result.data;
},
```
> **Note matching** : TanStack `meta` est statique à la définition. Pour des readKeys dynamiques, stocker dans un `Map<queryKeyHash, Set<string>>` partagé (nouveau module `packages/aura/src/client/read-registry.ts`) mis à jour dans `queryFn` et lu par le prédicat. C'est le remplaçant de `manifest-cache.ts`.
- `useMutation.onSuccess` (lignes 275-306) : remplacer le prédicat (lignes 282-294) par le matching readKeys :
```ts
const writeKeys = lastMetaRef.current?.invalidates ?? [];
await queryClient.invalidateQueries({
  predicate: (q) => {
    const reads = readRegistry.get(hashKey(q.queryKey)) ?? EMPTY;
    return writeKeys.some((k) => reads.has(k));
  },
});
```
Garder le BroadcastChannel local (lignes 296-302).

## A7. `packages/aura/src/client/provider.tsx`

- `AuraQueryInvalidator.onInvalidate` (lignes 49-65) : remplacer le prédicat entities (lignes 52-59) par le matching readRegistry (idem A6).
- Supprimer imports `manifestToEntityMap`, `setManifestEntities`, `getOperationEntities` (lignes 13-16, 18-26, 95-97) une fois la migration faite.
- **Souscription (routage)** : ajouter un effet qui observe l'union des readKeys actives et la pousse au WS via la nouvelle API du provider realtime (A9) :
```ts
useEffect(() => queryClient.getQueryCache().subscribe(() => {
  const union = collectActiveReadKeys(queryClient, readRegistry);
  realtime.setSubscriptions(union); // diff SUB/UNSUB géré dans le provider
}), []);
```

## A8. NOUVEAU `packages/aura/src/client/read-registry.ts`

Remplace `manifest-cache.ts` pour l'invalidation.
```ts
const registry = new Map<string, Set<string>>(); // hashKey(queryKey) -> readKeys
export function setReadKeys(hash: string, keys: string[]): void;
export function getReadKeys(hash: string): Set<string> | undefined;
export function deleteReadKeys(hash: string): void; // sur gcTime/remove
export function collectActiveReadKeys(qc: QueryClient): Set<string>;
```
(`hashKey` = `@tanstack/query-core`'s `hashKey`.)

## A9. `packages/plugins/realtime/src/client.tsx`

- Étendre `AuraRealtimeProviderProps` : `onInvalidate` reste, ajouter un handle de souscription. Exposer via context ou ref :
```ts
export interface RealtimeHandle { setSubscriptions(keys: Set<string>): void; }
```
- Le **leader** envoie au WS les diffs `{type:"SUB",keys}` / `{type:"UNSUB",keys}` quand l'union change. Les **siblings** publient leurs readKeys au leader via le `BroadcastChannel` existant (`CHANNEL="aura:realtime"`, ligne 7) ; le leader agrège l'union de tous les tabs avant d'émettre au serveur.
- Réutiliser leader-election Web Locks existant (lignes 112-127) et le dedup (lignes 57-68).

## A10. `packages/plugins/realtime/src/server.ts`

- Étendre `Client` (lignes 13-19) avec `keys: Set<string>`.
- `onMessage` (lignes 152-164) : gérer `SUB`/`UNSUB` :
```ts
if (msg.type === "SUB")  for (const k of msg.keys) { client.keys.add(k); index(k).add(id); }
if (msg.type === "UNSUB")for (const k of msg.keys) { client.keys.delete(k); index(k)?.delete(id); }
```
- Index inversé module-level : `const subs = new Map<string, Set<string>>(); // readKey -> clientIds`.
- `onClose` (lignes 165-170) : retirer le client de toutes ses keys dans `subs`.
- `POST /publish` (lignes 102-127) : remplacer `fanout(payload)` (ligne 124) par routage ciblé :
```ts
const targets = new Set<string>();
for (const wk of keys) {
  subs.get(wk)?.forEach((id) => targets.add(id));               // match exact (Model ou Model:id)
  if (wk.includes(":")) subs.get(wk.split(":")[0])?.forEach((id) => targets.add(id)); // Model:id write -> abonnés table
  else for (const [k, ids] of subs) if (k.startsWith(wk + ":")) ids.forEach((id) => targets.add(id)); // write table -> abonnés instances
}
for (const id of targets) clients.get(id)?.send(payload);
```
- Garder `fanout` + `/clients` (lignes 90-100) enrichis avec `keys` par client (obs/debug).

## A11. Suppression des API manuelles

- `operation.ts` : retirer `entities` de `BuilderState` (ligne 114), `AuraOperation` (ligne 74), `RegisteredAuraOperation` (ligne 96), `.entities()` du `HandlerStage` (lignes 282, 313-316), et `entities: Object.freeze(...)` (ligne 219).
- `registry.ts:getClientOperationManifest` (lignes 24-37) + `shared/manifest.ts` (lignes 4-9) : retirer le champ `entities`. Le manifest reste pour lister les ops (type/access).
- `client/manifest-cache.ts` : supprimer le fichier si plus aucun usage hors invalidation (grep d'abord).
- **Call-sites** : `grep -rn "\.entities(\[" apps packages` et `grep -rn "ctx\.invalidate(" apps packages` → supprimer chaque occurrence (le tracking auto les remplace ; pour un cas cross-modèle non tracké, remplacer par `ctx.track({ write: [...] })`).

## Vérification Partie A
1. `bun x tsc --noEmit` sur `packages/aura` + `apps/app` → 0 erreur.
2. Test unitaire `createTrackedDb` : `findUnique({where:{id:"1"}})` ⇒ read `Model:1` ; `findMany()` ⇒ `Model` + ids ; `update({where:{id:"1"}})` ⇒ write `Model`+`Model:1`.
3. `bun run dev` (vite :3000 + realtime :3001). Via tunnel cloudflared : 2 navigateurs, l'un sur Todo 1, l'autre sur Todo 2. Muter Todo 1 ⇒ seul le 1er refetch (Network panel) ; log `[aura:realtime] publish → N` ne compte que les abonnés.
4. Vue liste `Todo` se rafraîchit sur tout create/delete.
5. 2 onglets même navigateur ⇒ 1 seul WS (leader) ; invalidation via BroadcastChannel.
6. `GET :3001/clients` montre les keys souscrites par client.

> Le user teste via tunnel (pas localhost). Realtime nécessite `VITE_AURA_WS_URL` (2e hostname). L'agent ne pourra pas valider l'UI headless → décrire quoi observer et demander confirmation à 2 clients.

---

# PARTIE B — Refonte docs → skills

## B1. Structure cible

```
.claude/skills/
  aura-operations/SKILL.md        # defineOperationFn, query/mutate/action, auth, input/params, errors, bump
  aura-client/SKILL.md            # useQuery/useMutation (builder+options), AuraClientProvider, SSR prefetch/hydration
  aura-data/SKILL.md              # Prisma schema, entités, ctx.db, ctx.paginate, le modèle reactive (read/write keys)
  aura-context/SKILL.md          # ctx.* complet : auth, audit, log, notify, storage, scheduler, agent, runQuery/Mutation/Action
  aura-realtime/SKILL.md          # le subsystème reactive (Partie A) : comment ça marche, ctx.track, débogage routage
  aura-app-setup/SKILL.md         # wiring serveur (apps/app/src/server.ts), routes /aura /files, déploiement 2 process, env vars
.agents/rules/                    # règles courtes auto-chargées (conventions, build, deprecations)
  aura-conventions.md
AGENTS.md                         # MINCE : index qui pointe vers skills + rules
```

> Utiliser le **skill-manager** (skill dispo) pour générer chaque `SKILL.md` au bon format (frontmatter `name`/`description`, discovery). Ne pas inventer le frontmatter à la main.

## B2. Contenu de chaque skill (source = code réel, pas inventé)

Chaque SKILL.md = **frontmatter** + **quand l'utiliser** + **API (signatures réelles)** + **exemple réel tiré du code** (chemin cité) + **gotchas**. Sources à citer :

- **aura-operations** : `packages/aura/src/server/operation.ts` (builder, accès, validation zod), `core/errors.ts` (`AuraError` codes), `ctx.bump` vs throw. Exemples réels : `grep -rln "defineOperationFn" apps`.
- **aura-client** : `packages/aura/src/client/hooks.ts` (useQuery/useMutation overloads), `provider.tsx` (mount `AuraClientProvider`), helpers SSR (`grep -rn "prefetchAuraQuery\|AuraHydration" packages apps`).
- **aura-data** : `prisma/schema.prisma` (`find . -name schema.prisma -not -path '*/node_modules/*'`), `entities.ts`, `ctx.db`, `ctx.paginate` (`context.ts:113-134`, exemple `context.ts:116-126`), + **le modèle reactive** (réf Partie A : pas de `.entities()`, tracking auto, `ctx.track` escape hatch).
- **aura-context** : `packages/aura/src/server/context.ts` (surface complète), `create-context.ts` (impl), sous-systèmes : `@aura/notifications`, `server/storage/`, `@aura/workflows` (scheduler), `server/ai/` (agent), `server/auth/`.
- **aura-realtime** : résumé exécutable de la Partie A — flux read-key/write-key, routage serveur, leader election, débogage (`/clients`, logs), env vars (réf [[realtime-architecture]] en mémoire).
- **aura-app-setup** : `apps/app/src/server.ts` (routes inline `/aura`, `/aura-internal/`, `/files/`, `/health`), `Dockerfile.backend`/`Dockerfile.frontend`, déploiement 2 process + env (`AURA_INTERNAL_SECRET`, `AURA_REALTIME_INTERNAL_URL`, `AURA_APP_URL`, `VITE_AURA_WS_URL`).

## B3. `.agents/rules/aura-conventions.md`

Migrer les conventions actuellement dans `AGENTS.md` (sections *Coding conventions*, *Deprecations*, *Workflow*, *Build*) : no comments, barrel imports `@/aura/client|server`, build `tsc --noEmit` par projet, format commit. Utiliser **rules-manager** pour le format (AGENTS.md indexe `.agents/rules/`).

## B4. `AGENTS.md` mince (réécriture)

Réduire à un index :
```md
# Agent Instructions
Build d'apps avec le framework **aura**. Skills détaillés dans `.claude/skills/` :
- /aura-operations — définir queries/mutations/actions
- /aura-client — hooks React, provider, SSR
- /aura-data — schema Prisma, pagination, modèle reactive
- /aura-context — surface ctx.* (auth, notify, storage, scheduler, agent…)
- /aura-realtime — invalidation reactive (read/write keys, routage)
- /aura-app-setup — wiring serveur & déploiement
Conventions & build : `.agents/rules/`.
```
Retirer le gros bloc `<context>` framework (migré dans les skills).

## B5. Suppressions (action destructive — périmètre confirmé)

À supprimer : `PROMPT.md`, `PLAN.md`, `PLAN_THEMATIQUE.md`, `audit.md`, `session-ses_19ac.md`, `DEPLOY_PLAN.md` (son contenu déploiement utile → migré dans `aura-app-setup/SKILL.md` AVANT suppression).
**Conserver** : `TRACKER.md` et `CHANGELOG.md` (journaux vivants référencés par le workflow).

> Avant `rm`, vérifier qu'aucun de ces fichiers n'est référencé ailleurs (`grep -rln "DEPLOY_PLAN\|PLAN_THEMATIQUE\|PROMPT.md" . --exclude-dir=node_modules`). L'agent fait les suppressions à l'exécution, après migration du contenu réutilisable.

## Vérification Partie B
1. Chaque `SKILL.md` a un frontmatter valide (via skill-manager) et apparaît dans la liste des skills.
2. Les exemples de code cités existent réellement (chemins vérifiés).
3. `AGENTS.md` < 30 lignes, pointe vers tous les skills + rules.
4. Aucun lien mort vers un fichier supprimé (`grep`).
5. Smoke test : un agent neuf, en lisant uniquement les skills, peut écrire une query + mutation + composant client corrects pour un nouveau modèle.

---

# Ordre d'exécution suggéré
1. **A1→A5** (serveur : tracking + envelope) — testable en isolation via tsc + test unitaire tracked-db.
2. **A6→A8** (client : readRegistry + matching).
3. **A9→A10** (routage WS).
4. **A11** (suppression API manuelles) — après que le nouveau chemin marche.
5. **B2** (skills) en s'appuyant sur le code final, puis **B3→B4** (rules + AGENTS mince), puis **B5** (suppressions).
