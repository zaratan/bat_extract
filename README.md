# BatExtract

Un extracteur de données de cartes de distribution utilisant l'analyse de couleurs pour analyser la distribution des espèces de chauves-souris sur des cartes géographiques françaises.

## Table des matières

- [BatExtract](#batextract)
  - [Table des matières](#table-des-matières)
  - [Fonctionnalités](#fonctionnalités)
  - [Installation](#installation)
  - [Utilisation](#utilisation)
    - [Commandes principales](#commandes-principales)
  - [Workflow complet automatisé](#workflow-complet-automatisé)
    - [Commande unifiée (recommandée)](#commande-unifiée-recommandée)
    - [Étapes individuelles](#étapes-individuelles)
  - [Structure du projet](#structure-du-projet)
  - [Légende des couleurs](#légende-des-couleurs)
    - [Correspondance officielle](#correspondance-officielle)
    - [Correspondance technique](#correspondance-technique)
  - [Scripts disponibles](#scripts-disponibles)
  - [Approche technique](#approche-technique)
    - [Analyse par couleurs (vs OCR)](#analyse-par-couleurs-vs-ocr)
    - [Gestion des erreurs](#gestion-des-erreurs)
    - [Performance](#performance)
  - [Technologies](#technologies)
  - [Résultats](#résultats)
    - [Format des données extraites](#format-des-données-extraites)
    - [Format des images](#format-des-images)
  - [Source des données](#source-des-données)

## Fonctionnalités

- 🔍 **Extraction automatique** de données de distribution depuis des cartes d'espèces
- 🗺️ **Identification des départements** et de leur statut de distribution par analyse de couleurs
- 📦 **Traitement par lots** de plusieurs espèces (workflow dynamique basé sur scraping web)
- 📊 **Génération de rapports consolidés** avec statistiques détaillées
- 🎨 **Analyse de couleurs robuste** utilisant Sharp et coordonnées pré-mappées
- 📥 **Téléchargement automatique** des cartes depuis le Plan National d'Actions Chiroptères
- 🧠 **Découverte intelligente** des URLs réelles des images par scraping web
- 🔄 **Données à jour** : Génération dynamique de la liste d'espèces depuis le site officiel
- 📈 **Rapport Excel** : Matrice interactive espèces × départements avec formatage couleur

## Installation

```bash
pnpm install
```

## Utilisation

### Commandes principales

```bash
# WORKFLOW COMPLET (recommandé)
pnpm workflow      # Exécute automatiquement toutes les étapes avec rapport détaillé

# OU étapes individuelles :
# 1. Générer les données d'espèces depuis le site web
pnpm generate-species

# 2. Découvrir les vraies URLs d'images
pnpm discover-urls

# 3. Télécharger toutes les cartes
pnpm download

# 4. Télécharger uniquement les espèces prioritaires
pnpm download:priority

# 5. Extraire les données de toutes les cartes
pnpm extract

# 6. Générer un rapport Excel avec matrice colorée
pnpm excel

# 7. Vérification du code
pnpm lint          # Vérification
pnpm lint:fix      # Correction automatique
```

## Workflow complet automatisé

### Commande unifiée (recommandée)

```bash
pnpm workflow
```

Cette commande exécute automatiquement toutes les étapes dans l'ordre avec un rapport détaillé :

1. 🧬 **Génération des données d'espèces** → Scraping du site web pour extraire la liste des espèces à jour
2. 🔍 **Découverte des URLs** → Extraction des vraies URLs d'images par analyse des pages web
3. 📥 **Téléchargement** → Récupération de toutes les cartes de distribution
4. 🎨 **Extraction** → Analyse des couleurs et génération des données par département
5. 📊 **Rapport Excel** → Création de la matrice finale avec formatage couleur

**Avantages :**

- ✅ **Automatisation complète** : Plus besoin de lancer chaque étape manuellement
- ✅ **Données à jour** : Scraping dynamique du site officiel
- ✅ **Rapport détaillé** : Statistiques et métriques pour chaque étape
- ✅ **Gestion d'erreurs** : Continue même si une étape échoue partiellement
- ✅ **Validation** : Vérification automatique de chaque étape

### Étapes individuelles

Si vous préférez exécuter les étapes une par une :

#### 1. Génération des données d'espèces

```bash
pnpm generate-species
```

Cette étape scrape automatiquement le site <https://plan-actions-chiropteres.fr> pour extraire la liste complète et à jour des espèces de chauves-souris.

**Fonctionnalités :**

- ✅ **Scraping intelligent** : Analyse automatique de la page des espèces
- ✅ **Données dynamiques** : Toujours à jour avec le site web
- ✅ **Classification automatique** : Identification des espèces prioritaires
- ✅ **Format JSON** : Sauvegarde dans `output/generated-species-data.json`
- ✅ **Métadonnées** : Date de génération, source, statistiques

**Avantages vs fichier statique :**

- 🔄 Pas besoin de maintenance manuelle
- 🆕 Détection automatique des nouvelles espèces
- 📊 Statistiques précises et actuelles
- 🌐 Source unique de vérité (le site web officiel)

#### 2. Découverte des URLs réelles

```bash
pnpm discover-urls
```

Cette étape analyse chaque page d'espèce pour extraire l'URL réelle de l'image de carte de distribution.

**Fonctionnalités :**

- ✅ Scraping intelligent des pages d'espèces
- ✅ Extraction des URLs d'images réelles
- ✅ Sauvegarde JSON dans `output/discovered-image-urls.json`
- ✅ Gestion d'erreurs robuste
- ✅ Rapport détaillé des succès/échecs

#### 3. Téléchargement des cartes

```bash
# Toutes les espèces
pnpm download

# Espèces prioritaires uniquement
pnpm download:priority
```

**Fonctionnalités :**

- ✅ Téléchargement automatique depuis les URLs découvertes
- ✅ Fallback sur pattern d'URL si découverte échouée
- ✅ Gestion d'erreurs avec rapports détaillés
- ✅ Délai entre téléchargements (1 seconde) pour respecter le serveur
- ✅ Création automatique du dossier `/images`
- ✅ Noms de fichiers standardisés

**Format des noms :**

```text
plan-actions-chiropteres.fr-{slug}-carte-{slug}-2048x1271.png
```

#### 4. Extraction des données

```bash
pnpm extract
```

Cette commande :

1. 📸 Analyse toutes les images dans le dossier `/images`
2. 🦇 Extrait le nom de l'espèce depuis le nom du fichier
3. 🎨 Analyse les couleurs pour déterminer le statut de distribution
4. 🗺️ Mappe chaque département français avec son statut
5. 💾 Génère un rapport JSON par espèce dans `/output`

#### 5. Génération du rapport Excel

```bash
pnpm excel
```

Cette commande génère un fichier Excel (`output/bat-distribution-matrix.xlsx`) avec :

**Page 1 - Matrice de distribution :**

- ✅ **Lignes** : Espèces de chauves-souris (nombre variable selon scraping)
- ✅ **Colonnes** : Départements français (01-95)
- ✅ **Cellules colorées** : Selon le statut de distribution
- ✅ **Codes courts** : TR (très rare), R (rare), PC (peu commune), AC (assez commune), etc.
- ✅ **Panneaux figés** : Navigation facile dans la grande matrice

**Page 2 - Légende des couleurs :**

- ✅ **Correspondance complète** : Couleur → Statut → Description officielle
- ✅ **Codes RGB** : Valeurs hexadécimales des couleurs
- ✅ **Documentation** : Référence au Plan National d'Actions Chiroptères

## Structure du projet

```text
src/
  ├── extractSpeciesData.ts       # Point d'entrée pour l'extraction
  ├── multiSpeciesExtractor.ts    # Extracteur multi-espèces
  ├── smartExtractor.ts           # Logique d'extraction par analyse de couleurs
  ├── generateSpeciesData.ts      # Génération dynamique des données d'espèces
  ├── discoverImageUrls.ts        # Découverte des URLs réelles
  ├── downloadMaps.ts             # Téléchargement automatique
  ├── generateExcelReport.ts      # Génération de rapports Excel
  ├── runCompleteWorkflow.ts      # Orchestrateur du workflow complet
  └── types.ts                    # Définitions TypeScript

data/
  └── color-legend-mapping.ts     # Correspondance couleurs/statuts (config)

images/                           # Images téléchargées (ignoré par git)

output/                           # Tous les fichiers générés (ignoré par git)
  ├── generated-species-data.json      # Liste d'espèces scrapée
  ├── discovered-image-urls.json       # URLs découvertes
  ├── *-distribution.json              # Données par espèce
  ├── consolidated-species-report.json # Rapport consolidé
  └── bat-distribution-matrix.xlsx     # Matrice Excel colorée
```

**Organisation :**

- 📁 `src/` : Code source, scripts exécutables
- 📁 `data/` : Fichiers de configuration statiques
- 📁 `output/` : Tous les fichiers générés (JSON, Excel)
- 📁 `images/` : Cartes téléchargées

**Avantages de cette structure :**

- ✅ **Séparation claire** : Config vs données générées
- ✅ **Git-friendly** : Fichiers générés non versionnés
- ✅ **Maintenance facile** : Un seul dossier à nettoyer (`output/`)
- ✅ **Workflow reproductible** : Génération complète depuis les sources

## Légende des couleurs

### Correspondance officielle

Basée sur le Plan National d'Actions Chiroptères 2016-2025.

| Couleur       | Code Hex             | Statut d'extraction                 | Description officielle                                                       |
| ------------- | -------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| 🔴 Rouge      | `#ea5257`            | `très rarement inventoriée`         | Espèce actuellement très rarement inventoriée ou exceptionnellement observée |
| 🟠 Orange     | `#f7a923`            | `rare ou assez rare`                | Espèce actuellement rare ou assez rare                                       |
| 🟢 Vert clair | `#dbe7b0`            | `peu commune ou localement commune` | Espèce peu commune ou localement commune                                     |
| 🟢 Vert foncé | `#95cb9b`            | `assez commune à très commune`      | Espèce assez commune à très commune                                          |
| 🟡 Jaune      | `#ffef23`            | `présente mais mal connue`          | Espèce présente mais mal connue                                              |
| ⚫ Gris       | `#b0b1b3`            | `disparue ou non retrouvée`         | Espèce disparue ou non retrouvée sur la zone                                 |
| ⚪ Blanc/Écru | `#fffdea`, `#fefefe` | `absente`                           | Espèce absente, n'ayant jamais été trouvée                                   |

### Correspondance technique

Le fichier `data/color-legend-mapping.ts` contient :

- **Interface `ColorLegendEntry`** : Structure complète pour chaque entrée
- **Plages RGB de tolérance** : Gestion des variations de compression
- **Utilitaires `ColorLegendUtils`** : Méthodes pour la détection automatique
- **Documentation complète** : Correspondance officielle ↔ technique

```typescript
// Exemple d'utilisation
import { ColorLegendUtils } from './data/color-legend-mapping';

const status = ColorLegendUtils.getDistributionStatus(r, g, b);
const isPresent = ColorLegendUtils.isPresenceConfirmed(r, g, b);
```

## Scripts disponibles

| Script                         | Commande                 | Description                              |
| ------------------------------ | ------------------------ | ---------------------------------------- |
| **Workflow complet**           | `pnpm workflow`          | Exécute toutes les étapes automatiquement |
| **Génération espèces**         | `pnpm generate-species`  | Scrape la liste des espèces             |
| **Découverte URLs**            | `pnpm discover-urls`     | Scrape les vraies URLs d'images         |
| **Téléchargement**             | `pnpm download`          | Télécharge toutes les cartes            |
| **Téléchargement prioritaire** | `pnpm download:priority` | Télécharge les espèces prioritaires     |
| **Extraction**                 | `pnpm extract`           | Extrait les données de toutes les cartes |
| **Rapport Excel**              | `pnpm excel`             | Génère une matrice Excel colorée        |
| **Linting**                    | `pnpm lint`              | Vérification du code                     |
| **Correction**                 | `pnpm lint:fix`          | Correction automatique                   |

## Approche technique

### Analyse par couleurs (vs OCR)

Le projet utilise une approche d'analyse de couleurs plutôt que l'OCR pour plus de robustesse :

1. **🗺️ Coordonnées pré-mappées** : Chaque département français a des coordonnées relatives précises sur les cartes
2. **🎨 Échantillonnage de couleurs** : Analyse des pixels dans un rayon de 30px autour de chaque département
3. **🤖 Classification automatique** : Mapping automatique des couleurs vers les statuts de distribution
4. **📦 Traitement par lots** : Extraction automatique de toutes les cartes du dossier `/images`
5. **📊 Rapports consolidés** : Génération de statistiques multi-espèces pour analyse comparative

### Gestion des erreurs

- ✅ **Continuation** : Le traitement continue même en cas d'erreur sur une image
- ✅ **Rapports détaillés** : Identification des départements sans couleur détectée
- ✅ **Tolérance** : Plages RGB avec tolérance pour les variations d'image
- ✅ **Fallbacks** : URLs de secours pour le téléchargement

### Performance

- ⚡ **Traitement direct** avec Sharp (pas de fichiers temporaires)
- 🎯 **Analyse ciblée** par zone (rayon de 30px)
- 🔄 **Traitement par lots** optimisé
- 💾 **Sauvegarde incrémentale** des résultats

## Technologies

- **TypeScript** avec configuration stricte et typage explicite
- **Sharp** pour l'analyse d'images et le traitement de couleurs
- **Node.js** ≥18 avec fetch natif pour les téléchargements
- **ESLint** et **Prettier** pour la qualité du code
- **pnpm** comme gestionnaire de packages rapide
- **Coordonnées pré-mappées** des 101 départements français

## Résultats

### Format des données extraites

Chaque extraction génère :

**Par espèce** (`output/{espece}-distribution.json`) :

```json
{
  "metadata": {
    "extractionDate": "2025-08-09T...",
    "totalDepartments": 101,
    "detectedDepartments": 91,
    "sourceMap": "Espèce - Distribution Atlas"
  },
  "departments": [
    {
      "code": "01",
      "name": "Ain",
      "region": "Auvergne-Rhône-Alpes",
      "color": { "r": 149, "g": 203, "b": 155, "hex": "#95cb9b" },
      "distributionStatus": "assez commune à très commune",
      "confidence": "high"
    }
  ],
  "summary": {
    "byStatus": { "assez commune à très commune": 57 },
    "byRegion": { "Auvergne-Rhône-Alpes": 8 }
  }
}
```

**Rapport consolidé** (`output/consolidated-species-report.json`) :

- 📊 Statistiques par espèce
- 🗺️ Répartition géographique
- 📈 Comparaisons inter-espèces
- 🎯 Métriques de qualité

**Rapport Excel** (`output/bat-distribution-matrix.xlsx`) :

- 📋 **Matrice espèces × départements** avec cellules colorées selon le statut
- 🎨 **Codes couleur officiels** du Plan National d'Actions Chiroptères
- 📖 **Légende complète** sur une page séparée
- 🔒 **Panneaux figés** pour navigation facile dans la matrice
- 💡 **Codes courts** : TR (très rare), R (rare), PC (peu commune), AC (assez commune), etc.

### Format des images

Les images doivent suivre le pattern :

```text
plan-actions-chiropteres.fr-{espece}-carte-{espece}-2048x1271.png
```

**Exemples :**

- `plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png`
- `plan-actions-chiropteres.fr-grand-murin-carte-grand-murin-2048x1271.png`

## Source des données

**Plan National d'Actions en faveur des Chiroptères 2016-2025**  
Référence : <https://plan-actions-chiropteres.fr/>

Les cartes de distribution sont téléchargées directement depuis le site officiel et analysées automatiquement pour extraire les données de présence par département.
