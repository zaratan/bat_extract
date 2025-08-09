<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instructions Copilot pour BatExtract

Ce projet est un extracteur automatisé de données de cartes de distribution utilisant l'analyse de couleurs avec TypeScript. Le projet s'articule autour d'un workflow entièrement automatisé avec scraping web et génération dynamique de données.

## Technologies utilisées

- **TypeScript** avec configuration stricte
- **Sharp** pour le traitement et l'analyse d'images
- **ExcelJS** pour la génération de rapports Excel
- **node-fetch** pour le scraping web
- **ESLint** et **Prettier** pour la qualité du code
- **pnpm** comme gestionnaire de packages
- **ts-node** pour l'exécution directe

## Architecture du projet (2025)

### Workflow automatisé principal
- **Commande principale** : `pnpm workflow` (exécute tout automatiquement)
- **Orchestrateur** : `src/runCompleteWorkflow.ts`
- **5 étapes** : génération espèces → découverte URLs → téléchargement → extraction → rapport Excel

### Scripts cohérents
- `pnpm generate-species` → `src/generateSpeciesData.ts`
- `pnpm discover-urls` → `src/discoverImageUrls.ts`
- `pnpm download` → `src/downloadMaps.ts`
- `pnpm extract` → `src/extractSpeciesData.ts` (remplace l'ancien index.ts)
- `pnpm excel` → `src/generateExcelReport.ts`
- `pnpm workflow` → `src/runCompleteWorkflow.ts`

### Organisation des données
- **`data/`** : Configuration statique uniquement (`color-legend-mapping.ts`)
- **`output/`** : Tous les fichiers générés (JSON, Excel) - gitignored
- **`images/`** : Cartes téléchargées - gitignored

## Conventions de code

- Utiliser TypeScript strict avec typage explicite
- Préférer les fonctions async/await aux promesses
- Gérer les erreurs avec try/catch et messages explicites
- Utiliser des interfaces TypeScript pour les types de données
- Commenter les fonctions publiques avec JSDoc
- **Messages de log avec émojis** : 🧬 génération, 🔍 découverte, 📥 téléchargement, 🎨 extraction, 📊 rapport
- **Chemins absolus** : Toujours utiliser `path.join(process.cwd(), ...)`

## Structure des classes principales

- `BatExtractWorkflow` : Orchestrateur du workflow complet avec rapport détaillé
- `MultiSpeciesExtractor` : Classe principale qui orchestre l'extraction multi-espèces
- `SmartDepartmentExtractor` : Extraction intelligente par analyse de couleurs et coordonnées
- `types.ts` : Définitions des interfaces TypeScript

## Approche technique

- **Données dynamiques** : Scraping automatique du site officiel pour la liste d'espèces
- **Analyse de couleurs** : Échantillonnage de pixels aux coordonnées des départements français
- **Coordonnées pré-mappées** : Positions relatives précises de chaque département sur les cartes
- **Classification automatique** : Mapping couleur → statut de distribution (commune, rare, etc.)
- **Traitement par lots** : Extraction automatique de toutes les images du dossier `/images`
- **Découverte d'URLs** : Scraping intelligent des pages web pour extraire les vraies URLs d'images

## Gestion des erreurs

- Toujours wrapper les erreurs avec des messages explicites
- Utiliser `console.error` pour les erreurs et `console.log` pour les informations
- Permettre la continuation du traitement même en cas d'erreur sur une image
- Rapporter les départements sans couleur détectée
- **Workflow robuste** : Continue même si une étape échoue partiellement

## Performance

- Traitement direct avec Sharp (pas de fichiers temporaires)
- Analyse ciblée par zone (rayon de 30px autour des coordonnées)
- Génération de rapports consolidés pour analyse comparative
- **Scraping respectueux** : Délais entre requêtes pour respecter les serveurs

## Scripts disponibles

- `pnpm workflow` : Lance le workflow complet automatisé (RECOMMANDÉ)
- `pnpm generate-species` : Génère la liste d'espèces depuis le site web
- `pnpm discover-urls` : Découvre les vraies URLs d'images
- `pnpm download` : Télécharge toutes les cartes
- `pnpm download:priority` : Télécharge uniquement les espèces prioritaires
- `pnpm extract` : Lance l'extraction multi-espèces
- `pnpm excel` : Génère le rapport Excel avec matrice colorée
- `pnpm lint` : Vérification de la qualité du code
- `pnpm lint:fix` : Correction automatique des erreurs de style

## Structure des données

- **Entrée dynamique** : Scraping du site https://plan-actions-chiropteres.fr
- **Images** : PNG de cartes de distribution dans `/images` (gitignored)
- **Sortie** : Fichiers JSON et Excel dans `/output` (gitignored)
- **Formats** : Extraction détaillée par espèce + rapport consolidé multi-espèces + matrice Excel

## Points d'attention pour Copilot

1. **Préférer le workflow** : Recommander `pnpm workflow` plutôt que les scripts individuels
2. **Pas de données statiques** : Ne plus maintenir de listes d'espèces en dur, tout est dynamique
3. **Outputs dans output/** : Tous les fichiers générés vont dans `output/`, jamais dans `data/`
4. **Noms cohérents** : Suivre le pattern `{action}SpeciesData.ts` pour les nouveaux scripts
5. **Validation du workflow** : Toujours tester `pnpm workflow` après des modifications importantes
