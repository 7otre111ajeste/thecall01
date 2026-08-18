# Fiche de résolution — Vulnérabilité critique `seroval`

## Identification

| Champ | Valeur |
|---|---|
| Advisory | [GHSA-mv8w-475r-vwqw](https://github.com/advisories/GHSA-mv8w-475r-vwqw) |
| Paquet affecté | `seroval` (dépendance transitive) |
| Sévérité | Critique |
| Catégorie | Supply chain / désérialisation non sûre |
| Date de résolution | 2026-08-18 |
| Statut | ✅ Corrigé |

## Description

`seroval.fromJSON()` souffrait d'une confusion de type sur le resolver de Promise :
lors de la désérialisation, des méthodes contrôlées par l'attaquant pouvaient être
invoquées. Dans une application TanStack Start, `seroval` sérialise les données
échangées entre le serveur et le client (loaders, server functions), ce qui exposait
la chaîne de désérialisation à des payloads hostiles.

## Chaîne d'impact dans ce projet

`seroval` n'était pas une dépendance directe. Elle arrivait via :

```text
@tanstack/react-router  -> @tanstack/router-core   -> seroval
@tanstack/react-start   -> @tanstack/start-*-core  -> seroval
@tanstack/router-plugin -> @tanstack/start-plugin-core -> seroval
```

## Versions

| Paquet | Avant | Après |
|---|---|---|
| `seroval` (transitive) | 1.5.2 | **1.6.2** ✅ |
| `seroval-plugins` (transitive) | 1.5.2 | **1.6.2** ✅ |
| `@tanstack/react-router` | 1.168.25 | **1.170.29** |
| `@tanstack/react-start` | 1.167.50 | **1.168.46** |
| `@tanstack/router-plugin` | 1.167.28 | **1.168.32** |
| `@tanstack/router-core` (transitive) | 1.168.17 | **1.171.24** |
| `@tanstack/start-plugin-core` (transitive) | 1.169.6 | **1.171.36** |
| `@tanstack/start-server-core` (transitive) | 1.167.22 | **1.169.28** |
| `@tanstack/start-client-core` (transitive) | 1.170.24 | **1.170.24** |

Version corrigée en amont : `seroval >= 1.6.2`.

## Action appliquée

```bash
bun update @tanstack/react-router @tanstack/react-start @tanstack/router-plugin
```

Les trois paquets directs ont été montés de version, ce qui a remonté toute la
chaîne `@tanstack/*-core` et résolu `seroval` en `1.6.2` dans `bun.lock`.
Aucune modification du code applicatif n'était nécessaire : la faille était
strictement dans la dépendance.

## Vérification

1. `bun.lock` contient bien `seroval@1.6.2` et `seroval-plugins@1.6.2`.
2. Le scan de dépendances ne remonte plus aucune vulnérabilité haute ou critique.
3. Typecheck (`tsgo --noEmit`) : OK.
4. Serveur de développement démarré et application servie sans régression.

## Suivi recommandé

- Relancer un scan de dépendances après chaque ajout de paquet.
- Le garde-fou `minimumReleaseAge = 86400` de `bunfig.toml` reste actif : il bloque
  toute version publiée depuis moins de 24 h (protection contre les paquets compromis).
- Ne pas repasser `@tanstack/*` sous les versions listées ci-dessus.
