# BatExtract

Un extracteur de données de cartes de distribution utilisant l'analyse de couleurs pour analyser la distribution des espèces de chauves-souris sur des cartes géographiques françaises.

## Fonctionnalités

- Extraction automatique de données de distribution depuis des cartes d'espèces
- Identification des départements et de leur statut de distribution par analyse de couleurs
- Traitement par lots de plusieurs espèces
- Génération de rapports consolidés
- Utilisation de Sharp pour l'analyse d'images et de coordonnées pré-mappées

## Installation

```bash
pnpm install
```

## Utilisation

### Extraction

```bash
pnpm extract
```

Cette commande :

1. Analyse toutes les images dans le dossier `/images`
2. Extrait le nom de l'espèce depuis le nom du fichier
3. Génère un rapport par espèce dans `/output`
4. Crée un rapport consolidé

### Vérification du code

```bash
pnpm lint          # Vérification
pnpm lint:fix      # Correction automatique
```

## Structure du projet

```text
src/
  ├── index.ts                    # Point d'entrée principal
  ├── multiSpeciesExtractor.ts    # Extracteur multi-espèces
  ├── smartExtractor.ts           # Logique d'extraction par analyse de couleurs
  └── types.ts                    # Définitions TypeScript

images/                           # Images à analyser
output/                           # Rapports générés (ignoré par git)
```

## Format des images

Les images doivent être nommées avec le nom de l'espèce :

- `espece-nom.png` → espèce extraite : "espece-nom"
- `plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png` → espèce : "barbastelle-deurope"

## Résultats

Chaque extraction génère :

- Un fichier JSON par espèce avec les détails de distribution
- Un rapport consolidé avec toutes les espèces analysées

Les résultats sont automatiquement sauvegardés dans le dossier `/output` qui est ignoré par git pour éviter de committer les données extraites.

## Approche technique

Le projet utilise une approche d'analyse de couleurs plutôt que l'OCR :

1. **Coordonnées pré-mappées** : Chaque département français a des coordonnées précises sur les cartes
2. **Échantillonnage de couleurs** : Analyse des pixels dans un rayon de 30px autour de chaque département
3. **Classification automatique** : Mapping des couleurs vers les statuts de distribution (commune, rare, etc.)
4. **Traitement par lots** : Extraction automatique de toutes les cartes du dossier `/images`

## Technologies

- TypeScript avec configuration stricte
- Sharp pour l'analyse d'images et de couleurs
- Coordonnées pré-mappées des départements français
- ESLint et Prettier pour la qualité du code
- pnpm comme gestionnaire de packages
