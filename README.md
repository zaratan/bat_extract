# BatExtract

Un extracteur OCR d'images pour analyser la distribution des espèces de chauves-souris sur des cartes géographiques françaises.

## Fonctionnalités

- Extraction automatique de données de distribution depuis des cartes d'espèces
- Identification des départements et de leur statut de distribution
- Traitement par lots de plusieurs espèces
- Génération de rapports consolidés
- Utilisation de Tesseract.js pour l'OCR et Sharp pour le traitement d'images

## Installation

```bash
pnpm install
```

## Utilisation

### Extraction rapide

```bash
pnpm extract
```

Cette commande :

1. Analyse toutes les images dans le dossier `/images`
2. Extrait le nom de l'espèce depuis le nom du fichier
3. Génère un rapport par espèce dans `/output`
4. Crée un rapport consolidé

### Développement

```bash
pnpm dev
```

## Structure du projet

```
src/
  ├── index.ts              # Point d'entrée principal
  ├── multiSpeciesExtractor.ts  # Extracteur multi-espèces
  ├── smartExtractor.ts     # Logique d'extraction principale
  ├── imageProcessor.ts     # Traitement d'images
  ├── ocrEngine.ts         # Interface OCR
  └── types.ts             # Définitions TypeScript

images/                    # Images à analyser
output/                    # Rapports générés (ignoré par git)
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

## Technologies

- TypeScript avec configuration stricte
- Tesseract.js pour l'OCR
- Sharp pour le traitement d'images
- ESLint et Prettier pour la qualité du code
- pnpm comme gestionnaire de packages
