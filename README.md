# BatExtract

Outil d'extraction automatisée des données de distribution des chauves-souris françaises à partir de cartes couleur, avec consolidation en JSON + Excel.

---

## Partie 1 · Guide Débutant (lecture rapide)

> Objectif : Vous permettre d'obtenir rapidement un tableau récapitulatif sans connaissances techniques.

### 1. Que fait cet outil ?

Vous avez des cartes avec des couleurs (rouge, vert, jaune...) montrant où certaines espèces de chauves-souris sont présentes en France. BatExtract :

- Télécharge les cartes automatiquement
- Lit les couleurs sur chaque département
- Transforme tout en un fichier Excel facile à ouvrir

Vous obtenez un grand tableau : lignes = espèces, colonnes = départements, cellules = statut (couleur + code).

### 2. Pourquoi c'est utile ?

- Gagner du temps (plus besoin d'ouvrir les cartes une par une)
- Centraliser toutes les informations dans un seul fichier
- Avoir une base réactualisable (on peut relancer plus tard)

### 3. Ce qu'il vous faut (minimum)

| Élément              | Pourquoi                     | Comment vérifier               |
| -------------------- | ---------------------------- | ------------------------------ |
| Internet             | Télécharger cartes & données | Ouvrir un site web             |
| Node.js (version 22) | Faire tourner le programme   | `node --version` dans Terminal |
| pnpm                 | Installer les composants     | `pnpm --version`               |

> Si les commandes ci‑dessus ne fonctionnent pas : demander à un collègue technique ou suivre un guide d'installation Node.js + pnpm.

### 4. Installation (copier-coller)

Ouvrez le Terminal (Mac : Spotlight > "Terminal") puis collez :

```bash
git clone https://github.com/zaratan/bat_extract.git
cd bat_extract
pnpm install
```

### 5. Tout lancer (commande unique)

```bash
pnpm workflow
```

Patientez (quelques minutes selon connexion). La console affiche les étapes une par une.

### 6. Quand c'est fini, où sont les résultats ?

| Type                      | Où                                    | Ouvrir avec                       |
| ------------------------- | ------------------------------------- | --------------------------------- |
| Fichier Excel principal   | `output/bat-distribution-matrix.xlsx` | Excel, LibreOffice, Google Sheets |
| Données détaillées (JSON) | Dossier `output/`                     | Pour usages avancés               |
| Images téléchargées       | Dossier `images/`                     | Visionneuse d'images              |

### 7. Si je relance la commande, est-ce grave ?

Pas de souci. Les anciens fichiers sont remplacés proprement. Vous pouvez relancer si : coupure Internet, arrêt volontaire, batterie vide.

### 8. Personnalisation (optionnel – ignorer si ça semble obscur)

Vous pouvez ralentir ou accélérer légèrement le rythme de téléchargement via un fichier facultatif `batExtract.config.json` :

```jsonc
{
  "network": { "requestDelayMs": 400 },
}
```

Plus petit = plus rapide (évitez 0). Si vous ne savez pas quoi mettre, ne créez pas ce fichier.

### 9. Mémo des commandes

```bash
pnpm workflow         # Tout en une fois (recommandé)
# Commandes séparées (rarement nécessaire) :
pnpm generate-species # Récupérer la liste des espèces
pnpm discover-urls    # Trouver où sont les images
pnpm download         # Télécharger les cartes
pnpm extract          # Lire les couleurs
pnpm excel            # Recréer seulement le fichier Excel
```

### 10. Et si ça affiche une erreur ?

| Message / Cas                        | Ce que ça signifie                          | Que faire                                    |
| ------------------------------------ | ------------------------------------------- | -------------------------------------------- |
| Aucune espèce trouvée                | Le site source n'a pas répondu correctement | Relancer plus tard                           |
| Téléchargement échoué pour une image | Une carte manquante ou lente                | Relancer `pnpm download` puis `pnpm extract` |
| Couleur non reconnue                 | Variation inhabituelle                      | Ouvrir l'image et vérifier visuellement      |
| Arrêt inattendu                      | Fermeture du Terminal / coupure             | Relancer `pnpm workflow`                     |

### 11. Questions courantes

- Puis-je modifier manuellement la liste des espèces ? → Non, elle est récupérée automatiquement (c'est voulu pour rester à jour).
- Le fichier Excel peut-il être envoyé par e‑mail ? → Oui, c'est un fichier normal.
- Je peux lancer ça tous les jours ? → Oui, relancer ne casse rien.
- Et si je n'ai pas pnpm ? → Demandez à quelqu'un de l'installer ou suivez un tutoriel Node.js.

### 12. Glossaire ultra simple

| Terme    | Explication courte                                |
| -------- | ------------------------------------------------- |
| Terminal | Fenêtre texte où on tape des commandes            |
| Commande | Ligne à copier-coller puis Entrée                 |
| Workflow | Suite automatique d'étapes                        |
| JSON     | Format de fichier texte structuré (intermédiaire) |
| Config   | Petit fichier pour changer un comportement        |

### 13. Besoin d'aide ?

Montrez ce README à une personne technique et donnez-lui les messages d'erreur exacts copiés depuis le Terminal.

---

## Partie 2 · Documentation Technique

### Table des matières (technique)

- [Architecture générale](#architecture-générale)
- [Workflow détaillé](#workflow-détaillé)
- [Modules principaux](#modules-principaux)
- [Conventions et objectifs immuables](#conventions-et-objectifs-immuables)
- [Configuration](#configuration)
- [Tests et qualité](#tests-et-qualité)
- [Détails techniques clés](#détails-techniques-clés)
- [Heuristique de priorité d'espèces](#heuristique-de-priorité-des-espèces)
- [Performance et robustesse](#performance-et-robustesse)
- [Roadmap / évolutions ciblées](#roadmap--évolutions-ciblées)

### Architecture générale

```text
src/  -> Logique métier pure (ESM)
scripts/ -> Entrées CLI minces
data/ -> Données statiques (mapping couleurs, départements)
images/ -> Cartes téléchargées (gitignored)
output/ -> Résultats générés (gitignored)
tests/ -> Tests unitaires + intégration légère
```

Principes : séparation stricte I/O réseau vs analyse d'image, aucun résultat dans `data/`, ESM strict (`.js` dans imports relatifs), idempotence.

### Workflow détaillé

Ordre séquentiel (et émojis réservés au runtime) :

1. 🧬 SpeciesDataGenerator
2. 🔍 ImageUrlDiscoverer
3. 📥 MapDownloader
4. 🎨 MultiSpeciesExtractor (+ SmartDepartmentExtractor)
5. 📊 ExcelReportGenerator

Chaque étape produit des artefacts réutilisables et n'échoue pas globalement pour un cas isolé.

### Modules principaux

| Module                     | Rôle                         | Notes                                 |
| -------------------------- | ---------------------------- | ------------------------------------- |
| `SpeciesDataGenerator`     | Scraping liste d'espèces     | Aucune liste codée en dur             |
| `ImageUrlDiscoverer`       | Résolution des URLs d'images | Utilise données générées précédemment |
| `MapDownloader`            | Téléchargement contrôlé      | Délai réseau configurable             |
| `MultiSpeciesExtractor`    | Orchestration par espèce     | Gère accumulation des erreurs         |
| `SmartDepartmentExtractor` | Analyse couleur → statut     | Tolérances définies dans `data/`      |
| `ExcelReportGenerator`     | Génération matrice + légende | Support autosize configurable         |
| `BatExtractWorkflow`       | Enchaîne tout                | Option `failFast` / résilience        |

### Conventions et objectifs immuables

- Pas de listes d'espèces statiques
- Tous les résultats vont dans `output/`
- ESM strict, pas de `require()`
- Tests sans appels réseau réels (fetch mock systématique)
- Séparation nette scraping / téléchargement / analyse / export
- Rejouabilité : rerun sûr
- Émojis limités aux 5 préfixes d'étape dans les logs

### Configuration

Fichier source : `src/config/defaultConfig.ts` (gelé). Surcharges via merging strict (`mergeConfig`) et loader (`loadUserConfig.ts`).

Résumé du type :

```ts
interface DefaultConfig {
  paths: { imagesDir: string; outputDir: string; tempDir: string };
  extraction: {
    sampleRadius: number;
    minPixelThreshold: number;
    maxDepartmentRetries: number;
  };
  network: { requestDelayMs: number; timeoutMs: number; retryCount: number };
  parallel: {
    maxConcurrentDownloads: number;
    maxConcurrentExtractions: number;
  };
  excel: {
    sheetNameMatrix: string;
    sheetNameLegend: string;
    autosizeColumns: boolean;
  };
  workflow: {
    failFast: boolean;
    continueOnPartialErrors: boolean;
    verbose: boolean;
  };
  priorityDetection: {
    headingClassNames: string[];
    enableInlineStyleFallback: boolean;
    fallbackInlineStyleColors: string[];
    fallbackStyleColorKeyword: string | null;
    searchWindowChars: number;
  };
  sources: {
    baseUrl: string;
    speciesListPath: string;
    speciesPathSegment: string;
  };
  images: { resolutionSuffix: string; fileNamePattern: string };
}
```

Clés sensibles :

| Domaine           | Clé               | Rôle                               |
| ----------------- | ----------------- | ---------------------------------- |
| network           | requestDelayMs    | Throttling téléchargement/scraping |
| extraction        | sampleRadius      | Rayon (px) échantillonnage couleur |
| workflow          | failFast          | Arrêt précoce ou non               |
| priorityDetection | headingClassNames | Classes CSS marquant priorité      |
| images            | fileNamePattern   | Pattern fallback nommage           |

Override : fichier local `batExtract.config.json`, env `CONFIG`, argument `--config` (priorité décroissante).

### Tests et qualité

- Framework : Jest + TS (fetch mock obligatoire sur scraping)
- Garde global : échec si un test tente un fetch réel
- Couverture élevée sur chemins d'erreur critiques
- Lint : ESLint + Prettier (hooks Husky + CI)
- CI : lint + types + tests sur Node 20/22

### Détails techniques clés

- Mapping couleurs : `data/color-legend-mapping.ts` (tolérances + utilitaires)
- Localisation départements : fichier statique dédié
- Extraction couleur : échantillonnage centré + agrégation (évite scanning total)
- Gestion erreurs : accumulation + rapports JSON consolidés

### Heuristique de priorité des espèces

Basée sur : heading parent (h2–h6) contenant le lien avec classe `has-orange-background-color`. Mode dégradé sécurisé : si la classe disparaît → aucune prioritaire plutôt que faux positifs. Fallbacks futurs (inline style) préparés mais désactivés par défaut.

### Performance et robustesse

- Délai réseau simple (configurable) pour politesse serveur
- Possibilité future : parallélisation contrôlée (sémaphore)
- Idempotence systémique : ré-exécutions écrasent proprement
- Continuité : une espèce en échec n'arrête pas le lot

### Roadmap / évolutions ciblées

| Idée                                            | Statut   | Note                                |
| ----------------------------------------------- | -------- | ----------------------------------- |
| Config centralisée enrichie (formats multiples) | Planifié | Ne pas implémenter sans demande     |
| Logger structuré injectable                     | Planifié | Garder logs simples pour l'instant  |
| Parallélisation limitée                         | Planifié | Après validation stabilité actuelle |
| Collecte métriques consolidées                  | Planifié | Ajout d'un résumé global            |

### Bonnes pratiques internes

- Extraire un utilitaire si duplication ≥2 occurrences significatives
- Ajouter tests pour tout nouveau chemin d'erreur
- Préserver la granularité des modules (éviter classes "fourre-tout")

### Sécurité documentaire

Émojis limités (<20% sections) et uniquement indicatifs. Aucun ajout d'autres symboles décoratifs.

---

## Annexes

### Exemple override avancé

```jsonc
{
  "network": { "requestDelayMs": 250, "retryCount": 2 },
  "extraction": { "sampleRadius": 32, "minPixelThreshold": 12 },
  "workflow": { "failFast": false, "continueOnPartialErrors": true },
  "priorityDetection": {
    "headingClassNames": ["has-orange-background-color"],
    "searchWindowChars": 900,
  },
}
```

### Snippet de chargement manuel

```ts
import { loadUserConfig } from './src/config/loadUserConfig.js';
import { SpeciesDataGenerator } from './src/speciesDataGenerator.js';

const cfg = loadUserConfig({ argv: process.argv, env: process.env });
await new SpeciesDataGenerator(cfg).generateSpeciesData();
```

---

## Licence

À définir selon usage (aucune licence explicite fournie actuellement).

---

_Pour toute contribution : respecter les objectifs immuables et ajouter des tests couvrant chaque nouveau comportement._
