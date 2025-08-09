<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instructions Copilot pour BatExtract

Ce projet est un extracteur de données de cartes de distribution utilisant l'analyse de couleurs avec TypeScript. Voici les conventions et pratiques à suivre :

## Technologies utilisées

- **TypeScript** avec configuration stricte
- **Sharp** pour le traitement et l'analyse d'images
- **ESLint** et **Prettier** pour la qualité du code
- **pnpm** comme gestionnaire de packages
- **ts-node** pour l'exécution directe

## Conventions de code

- Utiliser TypeScript strict avec typage explicite
- Préférer les fonctions async/await aux promesses
- Gérer les erreurs avec try/catch et messages explicites
- Utiliser des interfaces TypeScript pour les types de données
- Commenter les fonctions publiques avec JSDoc

## Structure des classes

- `MultiSpeciesExtractor` : Classe principale qui orchestre l'extraction multi-espèces
- `SmartDepartmentExtractor` : Extraction intelligente par analyse de couleurs et coordonnées
- `types.ts` : Définitions des interfaces TypeScript

## Approche technique

- **Analyse de couleurs** : Échantillonnage de pixels aux coordonnées des départements français
- **Coordonnées pré-mappées** : Positions relatives précises de chaque département sur les cartes
- **Classification automatique** : Mapping couleur → statut de distribution (commune, rare, etc.)
- **Traitement par lots** : Extraction automatique de toutes les images du dossier `/images`

## Gestion des erreurs

- Toujours wrapper les erreurs avec des messages explicites
- Utiliser `console.error` pour les erreurs et `console.log` pour les informations
- Permettre la continuation du traitement même en cas d'erreur sur une image
- Rapporter les départements sans couleur détectée

## Performance

- Traitement direct avec Sharp (pas de fichiers temporaires)
- Analyse ciblée par zone (rayon de 30px autour des coordonnées)
- Génération de rapports consolidés pour analyse comparative

## Scripts disponibles

- `pnpm extract` : Lance l'extraction multi-espèces
- `pnpm lint` : Vérification de la qualité du code
- `pnpm lint:fix` : Correction automatique des erreurs de style

## Structure des données

- **Entrée** : Images PNG de cartes de distribution dans `/images`
- **Sortie** : Fichiers JSON dans `/output` (ignoré par git)
- **Formats** : Extraction détaillée par espèce + rapport consolidé multi-espèces
