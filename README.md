# BatExtract

Un extracteur de données de cartes de distribution utilisant l'analyse de couleurs pour analyser la distribution des espèces de chauves-souris sur des cartes géographiques françaises.

## Table des matières

- [BatExtract](#batextract)
  - [Table des matières](#table-des-matières)
  - [Fonctionnalités](#fonctionnalités)
  - [Installation](#installation)
    - [🔧 Prérequis système](#-prérequis-système)
    - [🚀 Installation pour débutants (Mac)](#-installation-pour-débutants-mac)
      - [1. Installer Homebrew (gestionnaire de paquets pour Mac)](#1-installer-homebrew-gestionnaire-de-paquets-pour-mac)
      - [2. Installer Node.js (environnement d'exécution JavaScript)](#2-installer-nodejs-environnement-dexécution-javascript)
      - [3. Installer pnpm (gestionnaire de paquets moderne)](#3-installer-pnpm-gestionnaire-de-paquets-moderne)
      - [4. Installer Git (système de contrôle de version)](#4-installer-git-système-de-contrôle-de-version)
      - [5. Télécharger le projet](#5-télécharger-le-projet)
      - [6. Installer les dépendances du projet](#6-installer-les-dépendances-du-projet)
      - [7. Vérification de l'installation](#7-vérification-de-linstallation)
      - [8. Premier lancement](#8-premier-lancement)
    - [⚡ Installation rapide (pour développeurs)](#-installation-rapide-pour-développeurs)
    - [🔧 Dépannage](#-dépannage)
      - ["command not found: brew"](#command-not-found-brew)
      - ["command not found: pnpm"](#command-not-found-pnpm)
      - [Permissions refusées](#permissions-refusées)
      - ["git clone" échoue](#git-clone-échoue)
  - [Utilisation](#utilisation)
    - [Commandes principales](#commandes-principales)
  - [Workflow complet automatisé](#workflow-complet-automatisé)
    - [Commande unifiée (recommandée)](#commande-unifiée-recommandée)
    - [Étapes individuelles](#étapes-individuelles)
      - [1. Génération des données d'espèces](#1-génération-des-données-despèces)
      - [2. Découverte des URLs réelles](#2-découverte-des-urls-réelles)
      - [3. Téléchargement des cartes](#3-téléchargement-des-cartes)
      - [4. Extraction des données](#4-extraction-des-données)
      - [5. Génération du rapport Excel](#5-génération-du-rapport-excel)
  - [Structure du projet](#structure-du-projet)
  - [Légende des couleurs](#légende-des-couleurs)
    - [Correspondance officielle](#correspondance-officielle)
    - [Correspondance technique](#correspondance-technique)
  - [Scripts disponibles](#scripts-disponibles)
  - [Tests](#-tests)
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

(Usage décoratif des émojis réduit : conservés surtout pour illustrer le workflow séquentiel plus bas.)

- **Extraction automatique** des données de distribution à partir des cartes
- **Identification des départements** par analyse de couleurs
- **Traitement par lots** multi-espèces (scraping dynamique)
- **Rapports consolidés** (JSON + Excel)
- **Analyse de couleurs** fiable (Sharp + coordonnées pré‑mappées)
- **Téléchargement contrôlé** des cartes
- **Découverte des URLs réelles** via scraping
- **Mise à jour dynamique** de la liste d'espèces (pas de statique)
- **Matrice Excel** espèces × départements (codes + couleurs)
- **Qualité de code automatisée** (lint, tests, CI)

## Qualité de code

Le projet utilise des outils automatisés pour garantir la qualité et la cohérence du code :

### 🛡️ Hooks Git automatiques

- **Husky** : Hooks Git pour intercepter les commits
- **lint-staged** : Vérifications automatiques uniquement sur les fichiers modifiés
- **ESLint + Prettier** : Formatage et vérification automatiques avant chaque commit

### 🔧 Vérifications automatiques

Lors de chaque `git commit`, les outils suivants s'exécutent automatiquement :

- **Fichiers TypeScript/JavaScript** : ESLint avec correction automatique (inclut Prettier)
- **Fichiers JSON/Markdown** : Formatage Prettier automatique

Lors de chaque `git push`, une vérification complète du code s'exécute :

- **Linting complet** : Vérification de tous les fichiers TypeScript
- **Types TypeScript** : Validation des types avec `tsc --noEmit`
- **Tests complets** : Exécution de toute la suite de tests

### 🤖 GitHub Actions

Le projet utilise une GitHub Action qui s'exécute automatiquement sur chaque push et pull request :

- **✅ Linting** : Vérification ESLint complète
- **✅ Formatage** : Contrôle du formatage Prettier
- **✅ Types** : Vérification TypeScript
- **✅ Tests** : Exécution complète de la suite de tests
- **✅ Multi-environnement** : Tests sur Ubuntu avec Node.js 20 et 22

**Avantages :**

- ✅ **Code cohérent** : Même style de code pour tous les contributeurs
- ✅ **Pas d'oubli** : Impossible de committer ou pusher du code non conforme
- ✅ **Productivité** : Correction automatique des erreurs simples
- ✅ **Performance** : Vérification uniquement des fichiers modifiés au commit
- ✅ **CI/CD** : Validation automatique dans le cloud

### 🚀 Commandes manuelles

Si vous voulez vérifier ou corriger le code manuellement :

```bash
# Vérification complète
pnpm lint

# Correction automatique
pnpm lint:fix

# Vérification des types TypeScript
pnpm type-check
```

## Installation

### 🔧 Prérequis système

- **macOS** : 10.15 (Catalina) ou plus récent
- **Node.js** : Version 22 recommandée (spécifiée dans `.nvmrc`)
- **Espace disque** : Au moins 500 MB libres
- **Connexion Internet** : Nécessaire pour télécharger les dépendances et les cartes

### 🚀 Installation pour débutants (Mac)

Si vous avez un Mac tout neuf et que vous n'avez jamais fait de développement, suivez ces étapes détaillées :

#### 1. Installer Homebrew (gestionnaire de paquets pour Mac)

Homebrew permet d'installer facilement des outils de développement sur Mac.

```bash
# Ouvrez le Terminal (Applications > Utilitaires > Terminal) et copiez-collez cette commande :
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Explication :** Cette commande télécharge et installe Homebrew. Vous devrez peut-être entrer votre mot de passe administrateur.

#### 2. Installer Node.js (environnement d'exécution JavaScript)

Node.js est nécessaire pour faire fonctionner le projet.

```bash
# Installez Node.js avec Homebrew :
brew install node
```

**Vérification :** Tapez `node --version` dans le Terminal. Vous devriez voir un numéro de version comme `v20.x.x`.

#### 3. Installer pnpm (gestionnaire de paquets moderne)

pnpm est plus rapide et efficace que npm pour gérer les dépendances.

```bash
# Installez pnpm globalement :
npm install -g pnpm
```

**Vérification :** Tapez `pnpm --version` dans le Terminal. Vous devriez voir un numéro de version.

#### 4. Installer Git (système de contrôle de version)

Git permet de télécharger le code du projet depuis GitHub.

```bash
# Installez Git avec Homebrew :
brew install git
```

**Vérification :** Tapez `git --version` dans le Terminal. Vous devriez voir un numéro de version.

#### 5. Télécharger le projet

```bash
# Clonez le projet dans votre dossier utilisateur :
cd ~
git clone https://github.com/zaratan/bat_extract.git
cd bat_extract
```

**Explication :** Cette commande télécharge le code source du projet dans un dossier nommé `bat_extract` dans votre dossier utilisateur.

#### 6. Installer les dépendances du projet

```bash
# Dans le dossier du projet, installez toutes les dépendances :
pnpm install
```

**Explication :** Cette commande lit le fichier `package.json` et installe automatiquement toutes les bibliothèques nécessaires.

#### 7. Vérification de l'installation

```bash
# Testez que tout fonctionne :
pnpm lint
```

**Résultat attendu :** Si tout est correctement installé, cette commande devrait s'exécuter sans erreur.

#### 8. Premier lancement

Une fois l'installation terminée, vous pouvez lancer le workflow complet :

```bash
# Exécutez le workflow automatisé :
pnpm workflow
```

**Ce qui va se passer :**

1. 🧬 Le programme va scraper le site web pour récupérer la liste des espèces
2. 🔍 Il va découvrir les URLs des cartes de distribution
3. 📥 Il va télécharger toutes les cartes (peut prendre quelques minutes)
4. 🎨 Il va analyser les cartes pour extraire les données de distribution
5. 📊 Il va générer un fichier Excel avec tous les résultats

**Durée estimée :** 5-10 minutes pour le workflow complet.

**Où trouver les résultats :**

- 📊 **Fichier Excel principal** : `output/bat-distribution-matrix.xlsx`
- 📁 **Données JSON détaillées** : Dossier `output/`
- 🖼️ **Cartes téléchargées** : Dossier `images/`

**Pour ouvrir le fichier Excel :** Double-cliquez sur `bat-distribution-matrix.xlsx` dans le dossier `output/`.

### ⚡ Installation rapide (pour développeurs)

Si vous avez déjà Node.js et pnpm installés :

```bash
pnpm install
```

#### 🎯 Avec nvm (Node Version Manager)

Si vous utilisez nvm pour gérer vos versions de Node.js :

```bash
# Utilisez la version Node.js spécifiée dans .nvmrc
nvm use

# Ou installez et utilisez automatiquement
nvm install && nvm use

# Puis installez les dépendances
pnpm install
```

**Note :** Le projet spécifie Node.js 22 dans le fichier `.nvmrc` pour garantir la cohérence entre tous les développeurs.

### 🔧 Dépannage

#### "command not found: brew"

- Solution : Redémarrez votre Terminal après l'installation de Homebrew

#### "command not found: pnpm"

- Solution : Utilisez `npm install -g pnpm` ou redémarrez votre Terminal

#### Permissions refusées

- Solution : Assurez-vous d'avoir les droits administrateur sur votre Mac

#### "git clone" échoue

- Solution : Vérifiez l'URL du repository GitHub ou utilisez SSH au lieu de HTTPS

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
- ✅ **Détection dynamique de priorité** : Basée uniquement sur la structure HTML réelle (aucune liste statique)
- ✅ **Format JSON** : Sauvegarde dans `output/generated-species-data.json`
- ✅ **Métadonnées** : Date de génération, source, statistiques

**Heuristique de priorité (actuelle) :**

La priorité est détectée directement sur la page liste via la présence d'un titre (balise `h2`–`h6`) portant la classe CSS `has-orange-background-color` contenant le lien de l'espèce.

| Élément inspecté                 | Critère                                                 | Décision             |
| -------------------------------- | ------------------------------------------------------- | -------------------- |
| Heading parent immédiat du `<a>` | Contient la classe exacte `has-orange-background-color` | `isPriority = true`  |
| Autre cas                        | Classe absente                                          | `isPriority = false` |

Aucune requête supplémentaire n'est effectuée juste pour déterminer la priorité (les pages détail peuvent être appelées plus tard pour d'autres enrichissements comme le nom latin).

**Pourquoi ce choix :**

- Correspond exactement au signal visuel réel du site (fond orange sur le heading)
- Stable tant que la classe CSS reste identique
- Zéro maintenance d'un Set de slugs → conformité aux règles du projet
- Simple à tester (fixtures HTML ciblées)

**Cas limites :**

- Si le site change la classe (`has-orange-background-color` renommée), les espèces ne seront plus marquées prioritaires → il faudra mettre à jour l'heuristique + tests.
- Si une future variation applique la couleur via style inline sans classe, une adaptation (fallback) sera à envisager explicitement.

**Tests associés :**

- Cas positif : heading avec la classe
- Cas négatif : heading sans la classe
- Comptage agrégé dans les métadonnées (`prioritySpecies`)

**Avantages vs heuristique précédente (badges / texte voisin) :**

- Réduction des faux positifs
- Moins de parsing contextuel fragile
- Plus proche de l'intention éditoriale réelle (mise en avant visuelle)
- Performances légèrement meilleures (moins d'analyse de fenêtres de texte)

**Évolutions possibles :**

- Paramétrer le nom de classe dans une future config centralisée
- Ajouter un fallback optionnel (ex: détection de style inline `background-color` si pertinent)

**Résumé :** détection purement structurelle → fiable, simple, idempotente.

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
src/                              # Code fonctionnel (logique métier)
  ├── multiSpeciesExtractor.ts    # Extracteur multi-espèces principal
  ├── smartExtractor.ts           # Logique d'extraction par analyse de couleurs
  ├── speciesDataGenerator.ts     # Générateur de données d'espèces
  ├── imageUrlDiscoverer.ts       # Découvreur d'URLs d'images
  ├── mapDownloader.ts            # Téléchargeur de cartes
  ├── excelReportGenerator.ts     # Générateur de rapports Excel
  ├── batExtractWorkflow.ts       # Orchestrateur du workflow complet
  └── types.ts                    # Définitions TypeScript

scripts/                          # Points d'entrée CLI (scripts exécutables)
  ├── extractSpeciesData.ts       # CLI: Lance l'extraction multi-espèces
  ├── generateSpeciesData.ts      # CLI: Génère les données d'espèces
  ├── discoverImageUrls.ts        # CLI: Découvre les URLs d'images
  ├── downloadMaps.ts             # CLI: Télécharge les cartes
  ├── generateExcelReport.ts      # CLI: Génère le rapport Excel
  └── runCompleteWorkflow.ts      # CLI: Lance le workflow complet

data/
  └── color-legend-mapping.ts     # Correspondance couleurs/statuts (config)

images/                           # Images téléchargées (ignoré par git)

output/                           # Tous les fichiers générés (ignoré par git)
  ├── generated-species-data.json      # Liste d'espèces scrapée
  ├── discovered-image-urls.json       # URLs découvertes
  ├── *-distribution.json              # Données par espèce
  ├── consolidated-species-report.json # Rapport consolidé
  └── bat-distribution-matrix.xlsx     # Matrice Excel colorée

tests/                            # Suite de tests complète
  ├── config.test.ts              # Tests de configuration et sécurité
  ├── colorUtils.test.ts          # Tests des utilitaires de couleur
  └── multiSpeciesExtractor.test.ts # Tests de l'extracteur principal
```

**Architecture :**

- 📁 `src/` : **Code fonctionnel pur** - Classes et fonctions métier réutilisables
- 📁 `scripts/` : **Points d'entrée CLI** - Scripts d'interface en ligne de commande
- 📁 `data/` : Fichiers de configuration statiques
- 📁 `output/` : Tous les fichiers générés (JSON, Excel)
- 📁 `images/` : Cartes téléchargées
- 📁 `tests/` : Suite de tests avec protection HTTP

**Avantages de cette architecture :**

- ✅ **Séparation claire** : Logique métier (`src/`) vs interface CLI (`scripts/`)
- ✅ **Réutilisabilité** : Classes dans `src/` peuvent être importées par d'autres projets
- ✅ **Tests propres** : Code testable séparé des points d'entrée
- ✅ **Maintenabilité** : Interface CLI simple, logique complexe isolée
- ✅ **Module ES/CommonJS** : Compatible avec différents environnements
- ✅ **Git-friendly** : Fichiers générés non versionnés

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

| Script                         | Commande                 | Description                               |
| ------------------------------ | ------------------------ | ----------------------------------------- |
| **Workflow complet**           | `pnpm workflow`          | Exécute toutes les étapes automatiquement |
| **Génération espèces**         | `pnpm generate-species`  | Scrape la liste des espèces               |
| **Découverte URLs**            | `pnpm discover-urls`     | Scrape les vraies URLs d'images           |
| **Téléchargement**             | `pnpm download`          | Télécharge toutes les cartes              |
| **Téléchargement prioritaire** | `pnpm download:priority` | Télécharge les espèces prioritaires       |
| **Extraction**                 | `pnpm extract`           | Extrait les données de toutes les cartes  |
| **Rapport Excel**              | `pnpm excel`             | Génère une matrice Excel colorée          |
| **Linting**                    | `pnpm lint`              | Vérification du code                      |
| **Correction**                 | `pnpm lint:fix`          | Correction automatique                    |
| **Vérification TypeScript**    | `pnpm type-check`        | Vérification des types TypeScript         |
| **Tests**                      | `pnpm test`              | Lancer tous les tests                     |
| **Tests avec couverture**      | `pnpm test:coverage`     | Tests + rapport de couverture             |

## 🧪 Tests

Suite de tests complète avec **sécurité absolue** - aucun test ne peut appeler le vrai site web :

- **Jest + TypeScript** : Configuration CommonJS stable et robuste
- **Mock explicite de globalThis.fetch** : Tous les tests qui déclenchent du scraping remplacent `fetch` par une fonction mock
- **Blocage réseau implicite** : Tout test qui oublierait de mocker un accès réseau doit être corrigé (objectif : zéro HTTP réel)
- **Suites de tests** : Configuration/sécurité, utilitaires couleur, extracteurs, workflow
- **Couverture** : Fonctions principales et scénarios d'erreur
- **CI/CD intégré** : Tests automatiques sur chaque commit/push
- **Architecture propre** : Tests séparés du code fonctionnel

```bash
# Lancer tous les tests
pnpm test

# Tests avec couverture de code
pnpm test:coverage

# Tests en mode watch
pnpm test:watch
```

**Sécurité :**

- ✅ **Fetch mocké** : `globalThis.fetch` surchargé localement dans chaque test de scraping
- ✅ **Tests isolés** : Chaque test utilise des données simulées
- ✅ **CI validé** : Aucun appel externe prévu
- ✅ **Architecture robuste** : Logique métier testable séparément des CLI

## Approche technique

### Analyse par couleurs (vs OCR)

Le projet privilégie l'analyse de couleurs plutôt que l'OCR pour une robustesse accrue :

1. 🗺️ Coordonnées pré-mappées : chaque département possède des coordonnées relatives stables.
2. 🎨 Échantillonnage ciblé : rayon configurable (ex. 30px) autour de chaque point de référence.
3. 🤖 Classification : mapping couleur → statut via tolérances définies dans `data/color-legend-mapping.ts`.
4. 📦 Traitement par lots : toutes les images présentes dans `images/` sont parcourues.
5. 📊 Agrégation : statistiques par espèce + consolidation multi-espèces pour Excel.

### Gestion des erreurs

- Continuer malgré des échecs isolés (image manquante, couleur non détectée).
- Collecter et exposer les erreurs dans les rapports JSON consolidés.
- Signaler explicitement : départements sans couleur ou ambiguë.
- Empêcher l'arrêt complet du workflow sur un seul échec réseau ponctuel.
- Mock explicite de `fetch` dans les tests pour garantir zéro trafic réel.

### Performance

- Sharp utilisé en mémoire (pas de fichiers temporaires intermédiaires).
- Analyse ciblée uniquement sur zones pertinentes (évite scan exhaustif de pixels).
- Possibilité future : parallélisation contrôlée (sémaphore) sans bloquer l'event loop.
- Idempotence : ré-exécuter une étape réécrit proprement sans inflation de données.

### Détection des espèces prioritaires

La détection est entièrement structurée et ne repose plus sur des motifs textuels autour du lien :

1. Parcours de chaque lien d'espèce (`href` contenant `/les-chauves-souris/les-especes/{slug}/`).
2. Recherche du heading englobant le plus proche (h2–h6) contenant ce lien.
3. Vérification de la présence de la classe exacte `has-orange-background-color` sur ce heading.
4. Attribution : `isPriority = (classe présente)`.

**Caractéristiques :**

- 🔍 Signal unique et explicite → faible ambiguïté
- 🔄 Aucune liste codée en dur
- 🧪 Couvert par des tests unitaires (fixtures minimales)
- 🛠️ Facile à adapter si le site change (un seul point à modifier)

**Surveillance recommandée :**

- Audit périodique (manuel) de la page source pour confirmer la persistance de la classe
- Ajout futur (si besoin) d'un test d'intégration simulant un changement de classe afin de documenter l'échec attendu

> Si la classe venait à disparaître, la détection redeviendrait neutre (zéro prioritaire) plutôt que faussement positive, ce qui est un mode dégradé plus sûr.
