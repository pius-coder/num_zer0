# Audit Aura — Mai 2026

## Verdict global

Aura est un projet ambitieux qui tente de répliquer l'expérience Convex (typed RPC, runtime full-stack, hooks auto-générés, dashboard) avec une stack Bun/Hono/TanStack Start. Le niveau d'exécution technique est surprenant pour un projet de cette taille — le builder chainable, le système d'invalidation, la gestion CSRF/HMAC, le workflow engine, et l'EventBus sont implémentés proprement. Mais le projet souffre de trois problèmes existentiels : (1) la séparation packages/aura vs apps/app est une illusion — le "framework" importe le client Prisma généré par l'app, ce qui le rend non réutilisable, (2) le projet essaie d'être framework + UI kit + agent runtime + dashboard + déploiement en même temps sans priorisation claire, (3) le dashboard est éphémère (EventBus in-memory, perte totale au restart) et présenté comme une feature produit alors que c'est un outil de dev. En l'état, Aura est une preuve de concept technique très prometteuse mais PAS un produit déployable en production sans travaux majeurs.

## Les 5 meilleures décisions

1. Builder chainable pour les artefacts (defineOperationFn, defineAgent, etc.) — API cohérente, type-safe, lisible
2. Trois types d'opérations (query/mutate/action) avec contextes typés — read-only DB Proxy pour les queries, DB interdite pour les actions
3. CSRF avec HMAC + auto-heal — signature HMAC, auto-reissue via le manifest, constant-time comparison
4. Broadcast multi-canal (BroadcastChannel + WebSocket + HMAC HTTP) — élégant et pragmatique
5. Invalidation par entités — cache granulaire côté client sans sur-invalidation

## Les 10 plus gros risques / défauts

1. **CRITIQUE — Couplage fatal packages/aura → apps/app** : packages/aura/src/server/db.ts importe @/generated/prisma/client qui résout vers apps/app. Le framework ne peut pas compiler sans l'app.
2. **CRITIQUE — 30+ dépendances d'application dans le package framework** : packages/aura/package.json liste react, recharts, langchain, zustand, etc.
3. **HAUT — Dashboard éphémère** : EventBus in-memory, ring buffer 1000 events, perte totale au restart.
4. **HAUT — Absence de CI/CD, tests insuffisants** : aucun pipeline, pas de tests d'intégration.
5. **HAUT — Workflow sleep = exception jetée en contrôle de flux** : WorkflowSleepError throw/catch, mécanisme de reprise fragile.
6. **MOYEN — Proxy Nitro = single point of failure + latence** : chaque appel Aura passe par un hop réseau supplémentaire.
7. **MOYEN — Dashboard livré avec zéro authentification** : optionalApiKeyMiddleware, si AURA_API_KEY absent le dashboard est PUBLIC.
8. **MOYEN — Dockerfiles non production-ready** : base image non pinnée, pas de .dockerignore, pas de healthcheck.
9. **MOYEN — Fragilité du SPA dashboard servi par Hono** : readFileSync depuis __dirname, cassé en contexte bun build.
10. **BAS — Conflits de typage runner** : mutation vs mutate déjà corrigé une fois, peut revenir.

## Notes / 10

| Domaine | Note |
|---------|------|
| Architecture | 5/10 |
| DX | 8/10 |
| Prod Readiness | 2/10 |
| Monétisation | 4/10 |
| Clarté du positionnement | 3/10 |

## Recommandations immédiates

1. Découpler packages/aura de apps/app (interface Prisma abstraite ou fusion)
2. Nettoyer les dépendances de packages/aura (garder hono, zod, uuid, prisma — supprimer react, recharts, langchain, etc.)
3. Rendre le dashboard persistant ou l'abandonner pour un export OpenTelemetry
4. Monter le rate-limiting middleware sur les routes bridge
5. Réduire le scope : supprimer AI agents et workflows durables du MVP
6. Créer un pipeline CI (GitHub Actions)
7. Écrire des tests d'intégration
