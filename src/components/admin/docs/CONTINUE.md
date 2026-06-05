# CONTINUE — Admin Dashboard

## État actuel

Dashboard admin complet avec 8 modules métier, architecture dossier-par-module.

### Ce qui fonctionne

- **Analytics**: KPIs, breakdown appareils/pays, événements récents
- **Users**: Tableau + suppression
- **Purchases**: Tableau des transactions
- **Activations**: Tableau des activations SMS
- **Accounting**: Comptes + écritures comptables
- **Promo Codes**: CRUD complet
- **Margins**: CRUD complet
- **Packages**: CRUD complet

### Problèmes connus

- Les formulaires CRUD utilisent des states inline (pas de shadcn Dialog encore)
- Pas de pagination pour les tables (limite 100 entrées)
- Pas de filtres/recherche
- Les mutations n'ont pas de retour toast (le global MutationCache les gère)
- Le module Accounting n'affiche pas les lignes détaillées par pièce

### Architecture

- **Layout**: `admin-layout.tsx` — guard admin + sidebar + routage des tabs
- **Hooks**: `hooks/use-admin-queries.ts` — adminKeys + tous les hooks
- **Modules**: Un dossier par module, chaque fichier < 200 lignes
- **Style**: CSS variables de l'app + accents landing

### Prochaines étapes possibles

1. Ajouter shadcn Dialog pour les formulaires CRUD
2. Ajouter pagination/filtres
3. Export CSV des données
4. Graphiques analytics (recharts)
5. Module de logs système
