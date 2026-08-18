# Corriger deux textes non traduits pendant l'appel

## Problème
Deux éléments de l'écran d'appel restent en français quand la langue est en anglais :
- le badge de mode en haut (affiche la valeur brute `realiste` au lieu de "Realistic")
- l'étiquette de l'appelant inconnu : `??? · masqué`

## Changements

1. **Badge de mode (en-tête de l'appel)**
   Utiliser la traduction existante `mode.<mode>` (déjà présente en FR/EN) au lieu d'afficher l'identifiant brut du mode. Même correction pour le mode affiché dans la liste des sauvegardes à écraser.

2. **Étiquette "masqué"**
   Ajouter une clé de traduction `game.masked` (FR : "masqué", EN : "masked") et l'utiliser à la place du texte en dur. Le composant de message reçoit la langue courante.

## Détails techniques
- `src/lib/i18n.ts` : ajouter la clé `game.masked`.
- `src/components/storyline/TheCallGame.tsx` : remplacer `{mode}` (ligne ~545) et `{s.mode}` (ligne ~701) par `t(\`mode.${mode}\`, lang)` ; passer `lang` au rendu du message "unknown" et remplacer le libellé en dur.
