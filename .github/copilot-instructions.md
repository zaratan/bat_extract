<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instructions Copilot pour BatExtract

Ce projet est un extracteur OCR d'images utilisant TypeScript. Voici les conventions et pratiques à suivre :

## Technologies utilisées

- **TypeScript** avec configuration stricte
- **Tesseract.js** pour l'OCR
- **Sharp** pour le traitement d'images
- **ESLint** et **Prettier** pour la qualité du code
- **pnpm** comme gestionnaire de packages

## Conventions de code

- Utiliser TypeScript strict avec typage explicite
- Préférer les fonctions async/await aux promesses
- Gérer les erreurs avec try/catch et messages explicites
- Utiliser des interfaces TypeScript pour les types de données
- Commenter les fonctions publiques avec JSDoc

## Structure des classes

- `BatExtractor` : Classe principale qui orchestre l'extraction
- `ImageProcessor` : Traitement et préprocessing des images
- `OCREngine` : Interface avec Tesseract.js
- `types.ts` : Définitions des interfaces TypeScript

## Gestion des erreurs

- Toujours wrapper les erreurs avec des messages explicites
- Utiliser `console.error` pour les erreurs et `console.log` pour les informations
- Permettre la continuation du traitement même en cas d'erreur sur une image

## Performance

- Initialiser le worker Tesseract une seule fois
- Nettoyer les ressources (worker, fichiers temporaires)
- Permettre le traitement par lots d'images

## Tests et validation

- Valider les fichiers d'entrée avant traitement
- Vérifier les extensions de fichiers supportées
- Retourner des résultats cohérents même en cas d'échec partiel
