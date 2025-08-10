<!-- Workspace-specific instructions for GitHub Copilot.
Objectif : maximiser la pertinence des suggestions, éviter les régressions, guider les refactors futurs.
-->

# Instructions Copilot pour BatExtract (GUIDE OPTIMISÉ)

Projet : Extraction automatisée de données de distribution d'espèces de chauves-souris via analyse d'images (couleurs) + scraping dynamique.

## 🎯 Objectifs immuables

1. Pas de listes d'espèces codées en dur → toujours générées dynamiquement (scraping).
2. Tous les fichiers générés vont dans `output/` (JSON, Excel) → ne jamais écrire dans `data/`.
3. Code métier pur dans `src/`, scripts CLI minces dans `scripts/`.
4. Utilisation stricte d'ESM (`import/export`) avec extensions `.js` dans les imports relatifs internes.
5. Tests : zéro appel HTTP réel (mock explicite de `globalThis.fetch`).
6. Préférer le workflow global `pnpm workflow` dans la documentation et les exemples.
7. Ne pas réintroduire de dépendances lourdes sans demande explicite (ex: pas de frameworks).
8. Ne jamais mélanger logique d'E/S réseau avec logique d'analyse d'image dans une même classe.
9. Logs runtime : conserver les émojis d'étapes (🧬 🔍 📥 🎨 📊) uniquement dans les sorties console, pas d'autres.
10. Documentation : limiter les émojis à ~20% des sections (pas d'ornementation systématique).
11. Conserver l'idempotence : relancer une étape ne doit pas casser les données existantes.

## 🧱 Architecture (vue synthétique)

- `src/` : Classes et fonctions pures (orchestrateur, extracteurs, générateurs).
- `scripts/` : Entrées CLI très minces qui appellent `src/`.
- `data/` : Config statique (ex: mapping couleurs, départements) – jamais de résultats dynamiques.
- `images/` : Téléchargements (gitignored).
- `output/` : Résultats JSON + Excel (gitignored).
- `tests/` : Uniquement tests du code `src/` (pas des scripts CLI).

## 📦 Modules principaux

- `BatExtractWorkflow` : Orchestration séquentielle complète.
- `SpeciesDataGenerator` : Scraping liste espèces.
- `ImageUrlDiscoverer` : Résolution d'URL d'images.
- `MapDownloader` : Téléchargement contrôlé (délais).
- `MultiSpeciesExtractor` : Boucle multi-images → délègue à `SmartDepartmentExtractor`.
- `SmartDepartmentExtractor` : Analyse couleur + classification par département.
- `ExcelReportGenerator` : Construction de la matrice Excel.

## 🧪 Tests – règles pour suggestions

- Toujours mocker : HTTP (surcharger `globalThis.fetch`), accès disque si effets secondaires, horloge/délais si nécessaire.
- Interdire tout appel réseau réel : toute absence de mock explicite de `fetch` dans un test ajoutant du scraping doit être signalée.
- Préférer tests unitaires sur logique pure + tests d'intégration légers sur orchestrateur.
- Vérifier : détection des couleurs limites, traitements d'erreur, fichiers générés.
- Ne jamais ajouter un test dépendant d'un ordre non déterministe sans contrôle (ex: Date.now non figé, tri implicite).

## 🧭 Conventions de code

- TypeScript strict → types explicites pour exports publics.
- Imports internes : chemin relatif avec extension `.js` (ESM Node).
- Utiliser `async/await` ; pas de `.then()` chaînés sauf cas trivial.
- Erreurs : `throw new Error('Contexte : cause d'origine')` ou wrapping explicite.
- Fonctions publiques : JSDoc concis (but + retour + erreurs possibles).
- Pas de duplication de logique : factoriser utilitaires dans `src/utils/` si réutilisé ≥2 fois.
- Pas de mutation cachée d'objets de config passés en paramètre (cloner si besoin).

## 🗂️ Fichiers statiques autorisés

- `data/color-legend-mapping.ts` : mapping couleurs → statut + utilitaires.
- `data/french-departments.ts` : coordonnées précises des départements.
  → Toute modification doit préserver signatures exportées.

## 🔐 Sécurité / Robustesse

- Continuer le traitement même si une espèce échoue (collecte des erreurs).
- Jamais arrêter un workflow complet sur une seule image manquante.
- Rapporter explicitement : départements sans couleur détectée.
- Utiliser des seuils configurables (ex: rayon échantillonnage) sans les coder partout.

## 📝 Logging (actuel)

- Utiliser `console.log` / `console.error` avec préfixe émoji d'étape UNIQUEMENT parmi : 🧬 🔍 📥 🎨 📊.
- Ne pas introduire de nouveaux émojis.
- Dans la documentation (README) : n'utiliser des émojis que lorsqu'ils clarifient une étape clé (≈20% max des titres/listes).
- Format recommandé : `[🧬 SpeciesDataGenerator] message`.

## 🔭 Refactors planifiés (ne PAS implémenter sans demande explicite)

1. Config centralisée (`defaultConfig`, merge partielle).
2. Logger structuré injectable (scopes).
3. Parallélisation contrôlée (semaphore utilitaire).
4. Collecte de métriques (compteurs + résumé final consolidé).
   → Si une PR touche ces aspects, vérifier d'abord cohérence tests existants.

## ✅ Checklist avant de proposer du code

- Le changement respecte-t-il les 10 objectifs immuables ?
- Aucune régression sur ESM (tous imports relatifs ont extension `.js`).
- Aucune nouvelle dépendance non discutée.
- Pas de données dynamiques ajoutées dans `data/`.
- Tests nécessaires identifiés (erreurs + succès + cas limite).
- Logs ajoutés au bon niveau (pas verbeux inutile).
- Pas de code mort / console.log de debug oublié.
- Usage émojis conforme (limités aux logs runtime, README sobre).

Si un point échoue → proposer d'abord une note expliquant la contrainte au lieu de générer du code approximatif.

## ❌ À NE PAS FAIRE

- Réintroduire `require()` / `module.exports`.
- Ajouter des scripts CLI qui contiennent de la logique métier complexe.
- Écrire dans un répertoire non ignoré pour des outputs.
- Agrandir massivement une classe existante au lieu d'extraire une fonction utilitaire.
- Laisser un test effectuer un vrai appel réseau (ou un fetch non mocké).
- Mélanger résolution d'URL et téléchargement effectif dans une même fonction.

## 💡 Heuristiques pour meilleures suggestions

- Si duplication détectée ≥ 8 lignes similaires → proposer extraction utilitaire.
- Si un bloc try/catch répète la même structure → suggérer helper `withErrorContext`.
- Si plusieurs fonctions passent les mêmes paramètres primitifs → proposer un objet options.
- Si des valeurs constantes apparaissent ≥3 fois → déplacer vers config ou constante nommée.

## 📂 Scripts CLI (rappel)

- Doivent seulement : parser arguments (si besoin futur), instancier classes, appeler méthode, gérer exit code.
- Jamais de logique d'analyse d'image ou parsing HTML dans un script.

## 🔄 Idempotence attendue

- Relancer `pnpm extract` ne doit pas corrompre les JSON existants (écrasement propre acceptable).
- `pnpm workflow` doit pouvoir être relancé après un échec partiel pour compléter les étapes manquantes.

## 🧬 Gestion des espèces

- Source unique : scraping (jamais maintenir une liste manuelle).
- Toute fonction qui manipule une espèce doit travailler avec un objet typé (éviter les tuples anonymes).

## 🧪 Stratégie de couverture minimale attendue pour nouveau module

1. Cas nominal.
2. Cas d'erreur principal (échec I/O, HTTP mock, image manquante...).
3. Paramètres optionnels (valeurs limites / override).
4. Résilience (continue malgré erreur locale).

## 🧷 Style TypeScript rapide

- Préférer `readonly` quand pertinent.
- Pas d'`any` sauf bridging explicite (commenté).
- Types dérivés via `Pick` / `Omit` pour éviter duplication.

## 🔁 Ordre actuel d'exécution workflow

1. 🧬 SpeciesDataGenerator
2. 🔍 ImageUrlDiscoverer
3. 📥 MapDownloader
4. 🎨 MultiSpeciesExtractor (→ SmartDepartmentExtractor)
5. 📊 ExcelReportGenerator

## 🧐 Quand NE PAS proposer de refactor

- Si changement touche seulement 1 appel et n'est pas réutilisé.
- Si cela ralentit la lisibilité pour un gain négligeable.
- Si cela introduit de la config prématurée non exploitée.

## 🧪 Exemple de suggestion acceptable (schématique – ne pas ajouter automatiquement)

```ts
// Extraction d'un utilitaire répétitif
export function safeJsonParse<T>(raw: string, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`Parse JSON failed (${context}): ${(e as Error).message}`);
  }
}
```

## 📌 En résumé pour Copilot

Toujours : ESM strict, séparation claire, tests sûrs, logs lisibles (émojis limités aux 5 étapes), ergonomie CLI minimale, refactors guidés par duplication réelle.

---

Mets à jour ce fichier (et uniquement lui) si de nouvelles règles transverses sont introduites.
