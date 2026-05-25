Tu es un architecte logiciel senior spécialisé dans :
- runtime platforms
- systèmes plugin
- frameworks extensibles
- architecture modulaire
- refactoring structurel profond
- monorepos TypeScript
- runtimes backend
- DX frameworks

Tu dois proposer une RESTRUCTURATION TOTALE du projet Aura.

IMPORTANT :
Le but n’est PAS :
- d’ajouter des wrappers,
- d’ajouter des couches de compatibilité,
- d’ajouter des adaptateurs legacy,
- de préserver l’architecture actuelle,
- de faire une migration “safe”.

Le but est :
- de REFAIRE l’architecture correctement,
- de SUPPRIMER les mauvaises abstractions,
- de CASSER les couplages structurels,
- de RÉDUIRE le core,
- de rendre Aura réellement modulaire,
- de construire une vraie plateforme runtime extensible.

Philosophie obligatoire :
- Réécriture > adaptation
- Contrats stables > backward compatibility
- Plugins first-class > features hardcodées
- Composition > barrels géants
- Runtime minimal > framework monolithique
- Capacités déclarées > imports directs
- Extensions officielles et communautaires utilisent EXACTEMENT les mêmes mécanismes
- Aucun wrapper legacy inutile
- Aucun alias temporaire “pour compatibilité”
- Aucun patch architectural
- Pas de “transitional architecture” permanente

Contexte actuel :
Aura est un monorepo Bun TypeScript full-stack basé sur :
- TanStack Start
- Hono
- Prisma/Postgres
- React
- builders chainables
- registry d’opérations
- runtime serveur
- hooks client
- dashboard
- observability
- AI
- search
- vector
- workflows
- cron
- storage
- realtime
- invalidation
- auth
- hydration
- pagination
- UI components
- CLI

Problème :
Le projet est actuellement un framework monolithique.
Le core connaît toutes les features.
Les features sont importées directement.
Le runtime est couplé à Prisma, React, Hono, LangChain, dashboard, etc.
Les plugins ne sont pas de vrais citoyens de première classe.

Nouvelle direction imposée :
Aura doit devenir :

“Un runtime platform minimal + système de plugins branchables + adapters officiels + registry communautaire.”

Le runtime doit être capable de fonctionner :
- sans React
- sans Prisma
- sans Hono
- sans dashboard
- sans AI
- sans search
- sans vector
- sans storage
- sans observability
- sans realtime

Toutes ces choses doivent devenir :
- plugins,
- adapters,
- packages séparés,
- ou être supprimées.

Tu dois proposer :
1. Une architecture cible COMPLETE
2. Une restructuration de dossiers COMPLETE
3. Une nouvelle séparation des packages
4. Une hiérarchie claire :
   - core runtime
   - adapters
   - plugins officiels
   - plugins communautaires
   - app hôte
5. Une stratégie de migration agressive
6. Les éléments à supprimer immédiatement
7. Les éléments à réécrire entièrement
8. Les éléments à garder
9. Les contrats stables à définir avant toute migration
10. Les breaking changes à accepter volontairement

IMPORTANT :
Tu ne dois PAS chercher à préserver l’API actuelle.

Tu dois privilégier :
- simplicité structurelle,
- cohérence,
- extensibilité,
- stabilité long terme,
- maintenabilité,
- packaging propre,
- séparation stricte des responsabilités.

Tu dois EXPLICITEMENT dire :
- quels fichiers doivent être supprimés,
- quels barrels doivent disparaître,
- quels imports sont interdits,
- quelles dépendances doivent sortir du core,
- quels contextes doivent être éclatés,
- quelles responsabilités doivent être déplacées.

Tu dois aussi proposer :
- un vrai contrat `AuraPlugin`,
- un système de capabilities,
- un registry unifié,
- un système d’extension de contexte,
- un système de mounting de routes,
- un système de discovery extensible,
- un système d’introspection runtime,
- un système de plugins CLI,
- un système de versioning plugins/core.

Tu dois évaluer TOUS les domaines existants :
- operations
- query/mutation/action
- registry
- runner
- transport
- Hono
- Prisma
- React
- hooks
- hydration
- auth
- workflows
- cron
- broadcast
- observability
- dashboard
- AI
- search
- vector
- pagination
- invalidation
- params
- storage
- CLI
- UI

Pour chacun :
- core ?
- adapter ?
- plugin officiel ?
- package séparé ?
- supprimer ?

Tu dois aussi proposer :
- une structure monorepo finale,
- des noms de packages cohérents,
- des boundaries strictes,
- des règles d’import,
- une politique de dépendances.

Tu dois être extrêmement critique.

Tu dois signaler :
- les anti-patterns,
- les couplages cachés,
- les faux plugins,
- les barrels toxiques,
- les singletons dangereux,
- les contextes monstrueux,
- les registries dispersés,
- les responsabilités mélangées,
- les dépendances runtime inutiles,
- les leaks React/Hono/Prisma dans le core.

Tu dois produire :
1. Verdict global
2. Nouveau modèle mental d’Aura
3. Architecture cible
4. Structure packages finale
5. Contrat AuraPlugin complet
6. Système de capabilities
7. Runtime lifecycle
8. Plugin lifecycle
9. Context architecture
10. Registry architecture
11. Routing architecture
12. Manifest architecture
13. Discovery architecture
14. Observability architecture
15. Dashboard architecture
16. Packaging strategy
17. Versioning strategy
18. Migration roadmap PHASE PAR PHASE
19. Breaking changes volontaires
20. Liste des suppressions immédiates
21. Liste des réécritures complètes
22. Les 10 plus gros risques si Aura continue l’architecture actuelle
23. Les 10 décisions non négociables
24. Une conclusion directe et brutale

IMPORTANT :
Ne jamais proposer :
- des wrappers legacy permanents,
- des alias temporaires longs termes,
- des couches de compatibilité inutiles,
- des bridges “magiques”,
- des adaptateurs pour sauver une mauvaise abstraction.

Si une abstraction est mauvaise :
- supprimer,
- réécrire,
- casser la compatibilité,
- repartir proprement.

Le but est :
“Construire un runtime platform extensible sérieux, pas sauver un framework monolithique.”