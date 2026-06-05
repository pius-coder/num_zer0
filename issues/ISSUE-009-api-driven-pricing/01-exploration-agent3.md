## Agent 3 — Tests / schema / config / docs

### Rapport d'exploration

| Fichier | Intervalle | Rôle | Verdict |
|---------|-----------|------|---------|
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | Lignes 1-74 (fichier complet) | Tests des prix statiques : `usdToXaf` (5 tests), `COUNTRIES` (3 tests), `getCountryByIso` (2 tests), `SERVICES` (1 test). Le test vérifie `priceUsd`, `priceXaf`, `flag` sur chaque entrée. | **À supprimer** — toute la logique de prix statique (usdToXaf, priceXaf, priceUsd dans COUNTRIES) est remplacée par l'API-driven pricing. Les tests `SERVICES` (lignes 67-73) et `getCountryByIso` (lignes 57-65) pourraient être gardés si ces fonctions survivent, mais dépendent de `data.ts` qui va changer. |
| `C:\Users\pc\num_zer0\src\__tests__\convex\sms_countries.test.ts` | Lignes 1-73 (fichier complet) | Tests de mapping pays (SMS_COUNTRY_MAP, ISO_TO_SMS, numericToIso, isoToNumeric). Ce mapping est un ID/numeric ↔ ISO code (ex. 33 → FR), **indépendant des prix**. | **À garder** — aucun lien avec les prix statiques. Mapping téléphonique pur, toujours nécessaire pour le provider SMS. |
| `C:\Users\pc\num_zer0\convex\schema.ts` | Lignes 31-37 (`packages` table) + lignes 38-55 (`purchases` table) | `priceXaf` dans `packages` (ligne 34) et `purchases` (ligne 41). `packages` concerne les forfaits de recharge (topup), pas l'activation SMS. **Hors scope** de ISSUE-009 (qui remplace les prix statiques des activations SMS). | **Hors scope** — `priceXaf` dans packages/purchases concerne le rechargement wallet (via Fapshi), pas les prix de service par pays. |
| `convex/schema.ts` (suite) | Lignes 90-121 (`activations` table) | Table des activations SMS. Champ `maxPrice` (ligne 106) et `priceCharged` (ligne 112) — ce sont les prix effectifs au moment de l'activation. | **À mettre à jour** — le flux de pricing API va définir `maxPrice` et `priceCharged`. Ces champs restent mais leur provenance change (API → plus de statique). |
| `C:\Users\pc\num_zer0\.env.example` | Lignes 70-73 (section SMSONLINEPRO) | Clé `SMSONLINEPRO_API_KEY` documentée. | **À garder** — toujours nécessaire pour appeler l'API SMSOnlinePro (fournisseur de numéros virtuels). La section est déjà présente et correcte. |
| `C:\Users\pc\num_zer0\convex\_generated\api.d.ts` | N/A (auto-généré) | Types auto-générés par Convex à partir de `schema.ts` et des fichiers `convex/`. | **Hors scope** — régénéré automatiquement par `npx convex dev`. Ne pas toucher. |
| `C:\Users\pc\num_zer0\ARCHITECTURE.md` | Lignes 198-201 (section "Service Activation Flow") | Décrit le pricing actuel : "EUR base rates → XAF markup formula" avec les marges et la formule `ceil(priceEUR * 655.957) + margin`. | **À mettre à jour** — cette section décrit le système de prix statique qui sera remplacé par l'API-driven pricing. Remplacer par la nouvelle logique. |
| `C:\Users\pc\num_zer0\ARCHITECTURE.md` | Lignes 205-217 (section "Database Schema") | Liste les tables Convex. `packages`, `purchases` avec leurs index. | **Hors scope** — pas de changement de schéma pour l'instant (les prix API sont récupérés côté client, pas stockés dans une nouvelle table). |
| `C:\Users\pc\num_zer0\src\components\spa\docs\` | **N'EXISTE PAS** | Le répertoire `docs/` n'existe pas dans `src/components/spa/`. Il n'y a pas de CHANGELOG.md, CONTINUE.md, ni TODOS.md pour la feature SPA (`my-space-page.tsx`, etc.). | **À créer** — selon le guide AGENTS.md, chaque feature doit avoir ses lifecycle docs. La page SPA (My Space) affiche les prix des services. L'issue devrait ajouter ces docs. |

### Notes complémentaires

**Constat important — `usdToXaf` introuvable :**
- `src/__tests__/services/data.test.ts` ligne 2 importe `usdToXaf` depuis `@/components/services/data`.
- `src/components/services/data.ts` utilise `usdToXaf()` dans chaque entrée de `COUNTRIES` (lignes 665-747).
- Pourtant, `usdToXaf` n'est **ni défini ni exporté** nulle part dans `data.ts` ni dans aucun fichier du projet.
- Soit la fonction a été supprimée accidentellement, soit elle était définie dans un fichier qui n'existe plus, soit le projet ne compile pas actuellement.
- **Action recommandée :** dans le cadre d'ISSUE-009, cette fonction et son utilisation disparaîtront de toute façon avec le passage à l'API.

**Interface `CountryPrice` incohérente :**
- L'interface `CountryPrice` (data.ts, lignes 8-13) ne déclare que `iso`, `code`, `name`, `phonePrefix`.
- Le tableau `COUNTRIES` (lignes 664-747) utilise aussi `priceUsd`, `priceXaf`, et `flag` — des champs qui ne sont pas dans l'interface.
- Cela signifie que TypeScript devrait lever des erreurs. Ce bug préexistant sera résolu par la suppression des prix statiques.

**Les tests à garder (sms_countries.test.ts) :**
- `sms_countries.test.ts` est indépendant des prix. Il teste le mapping des indicatifs téléphoniques (numeric ↔ ISO).
- Ce mapping vient de `convex/sms_countries.ts` (fichier non listé dans la mission mais à ne pas toucher).
- Aucune modification nécessaire pour ISSUE-009.

**Schema Convex :**
- `packages.priceXaf` et `purchases.priceXaf` concernent le rechargement wallet (topup), pas les activations SMS. Hors scope.
- `activations.maxPrice` et `activations.priceCharged` sont les champs impactés : ils seront désormais définis via l'API SMSOnlinePro plutôt que par lookup dans `COUNTRIES`.

### Résumé des actions

| Fichier | Action |
|---------|--------|
| `src/__tests__/services/data.test.ts` | Supprimer (tests de prix statiques obsolètes) |
| `src/__tests__/convex/sms_countries.test.ts` | Garder (aucun changement) |
| `convex/schema.ts` — packages/purchases | Hors scope |
| `convex/schema.ts` — activations | À mettre à jour (commentaire/documentation sur la provenance des prix) |
| `.env.example` | Garder (SMSONLINEPRO_API_KEY déjà présente) |
| `convex/_generated/api.d.ts` | Hors scope (auto-généré) |
| `ARCHITECTURE.md` lignes 198-201 | Mettre à jour la section pricing |
| `ARCHITECTURE.md` lignes 205-217 | Hors scope |
| `src/components/spa/docs/` | Créer le dossier avec CHANGELOG.md, CONTINUE.md, TODOS.md |
