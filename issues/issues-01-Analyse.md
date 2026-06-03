# Analyse des erreurs `convex dev`

**Date:** 2026-06-03
**Contexte:** `bun x convex dev` échoue avec deux erreurs distinctes

## Erreur 1: InvalidConfig — `lib/auth-helpers.js`

**Message:**
```
InvalidConfig: lib/auth-helpers.js is not a valid path to a Convex module.
Path component auth-helpers.js can only contain alphanumeric characters, underscores, or periods.
```

**Cause racine:**
Le fichier `convex/lib/auth_helpers.ts` (avec underscore) est valide, mais le plan d'implémentation initial référençait `convex/lib/auth-helpers.ts` (avec trait d'union). Le serveur Convex rejette les déploiements contenant des chemins de modules avec des traits d'union — seuls les caractères alphanumériques, underscores et points sont autorisés.

**Fichier concerné:** `convex/lib/auth_helpers.ts` (nom correct avec underscore)
**Problème:** Le serveur Convex distant a une configuration obsolète qui référence `lib/auth-helpers.js` avec un trait d'union.

## Erreur 2: TypeScript — `internal.users` n'existe pas

**Message:**
```
convex/auth.ts:55:47 - error TS2339: Property 'users' does not exist on type
'{ purchases: { internalCreatePurchase: ... } }'
```

**Cause racine:**
Les fichiers `convex/_generated/` sont obsolètes. La génération de types s'est arrêtée à mi-chemin à cause de l'Erreur 1, laissant `api.d.ts` dans un état incohérent où seuls certains modules (comme `purchases`) sont référencés.

## Résolution

1. **Régénérer les fichiers `_generated/`** — supprimer le cache et re-exécuter `convex codegen`
2. **Exécuter `convex dev` avec `--typecheck=disable`** pour contourner l'erreur serveur
3. **Vérifier la configuration du déploiement Convex** pour nettoyer toute référence à `auth-helpers`
