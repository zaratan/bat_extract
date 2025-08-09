# Tests de l'Extracteur de Données

Ce projet utilise **Jest** avec **nock** pour garantir que tous les tests sont complètement isolés et ne font jamais d'appels HTTP réels vers le site web.

## 🛡️ Sécurité des Tests

### Protection Absolue Contre les Appels Réels

- ✅ **Tous les appels HTTP sont bloqués** par `nock.disableNetConnect()` dans `tests/setup.ts`
- ✅ **Aucun test ne peut appeler le vrai site** - c'est physiquement impossible
- ✅ **Toutes les données sont mockées** dans `tests/mocks/`

### Configuration Jest

Le projet utilise Jest avec la configuration ESM pour TypeScript :

```json
{
  "preset": "ts-jest/presets/default-esm",
  "testEnvironment": "node",
  "extensionsToTreatAsEsm": [".ts"],
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"]
}
```

## 📁 Structure des Tests

```
tests/
├── setup.ts                    # Configuration globale (bloque HTTP)
├── basic.test.ts               # Tests de base (mocking HTTP)
├── colorLegendUtils.test.ts    # Tests des utilitaires de couleur
├── multiSpeciesExtractor.test.ts # Tests de l'extracteur multi-espèces
├── integration.test.ts         # Tests d'intégration avec mocks
└── mocks/
    ├── data.ts                 # Données mockées
    └── images.ts               # Utilitaires d'images mockées
```

## 🧪 Types de Tests

### 1. Tests Unitaires (`*.test.ts`)

**Objectif** : Tester les fonctions individuelles en isolation

```typescript
// Exemple : Test d'une fonction utilitaire
test('devrait identifier correctement une couleur', () => {
  const result = ColorLegendUtils.getDistributionStatus(149, 203, 155);
  expect(result).toBe('assez commune à très commune');
});
```

### 2. Tests d'Intégration avec Mocks

**Objectif** : Tester les interactions entre composants avec des données simulées

```typescript
// Exemple : Mock d'une réponse HTTP
const scope = nock('https://plan-actions-chiropteres.fr')
  .get('/les-especes/')
  .reply(200, '<html>...données mockées...</html>');
```

### 3. Tests de Protection Anti-HTTP

**Objectif** : Vérifier que les appels réels sont impossibles

```typescript
test('devrait empêcher les appels HTTP réels', () => {
  expect(nock.isActive()).toBe(true);
  // Tout appel non mocké sera rejeté
});
```

## 🚀 Exécution des Tests

### Commandes Disponibles

```bash
# Lancer tous les tests
pnpm test

# Lancer les tests en mode watch
pnpm test:watch

# Lancer les tests avec couverture
pnpm test:coverage

# Lancer les tests en mode CI
pnpm test:ci
```

### Intégration Continue

Les tests s'exécutent automatiquement :

- ✅ **Pre-commit** : via Husky (lint-staged)
- ✅ **Pre-push** : via Husky (lint + type-check)
- ✅ **GitHub Actions** : sur chaque push/PR (Node.js 20 & 22)

## 📋 Écriture de Nouveaux Tests

### 1. Créer un Nouveau Fichier de Test

```typescript
// tests/monModule.test.ts
import * as nock from 'nock';
import { MaFonction } from '../src/monModule';

describe('Mon Module', () => {
  afterEach(() => {
    nock.cleanAll(); // Nettoyer les mocks après chaque test
  });

  test('devrait faire quelque chose', () => {
    // Arrange, Act, Assert
  });
});
```

### 2. Mocker des Appels HTTP

```typescript
// Mock d'une API externe
const scope = nock('https://example.com')
  .get('/api/data')
  .reply(200, { data: 'mock data' });

// Vérifier que le mock a été appelé
expect(scope.isDone()).toBe(true);
```

### 3. Tester des Fonctions d'Extraction

```typescript
// Tester avec des données HTML mockées
const mockHtml = '<div class="species">Barbastelle</div>';
const result = extractSpeciesFromHtml(mockHtml);
expect(result).toEqual(['Barbastelle']);
```

## 🔍 Debugging des Tests

### Variables d'Environnement

```bash
# Afficher les logs pendant les tests
DEBUG_TESTS=true pnpm test

# Mode verbose
pnpm test --verbose

# Tests spécifiques
pnpm test colorLegendUtils
```

### Problèmes Courants

1. **Import ESM** : Utiliser `import * as module` pour les modules CJS
2. **Regex ES2018** : Utiliser `[\s\S]*?` au lieu de `.*?` avec flag `s`
3. **Mocks non nettoyés** : Toujours appeler `nock.cleanAll()` dans `afterEach`

## 🎯 Objectifs des Tests

1. **Couverture** : Viser 80%+ de couverture de code
2. **Fiabilité** : Aucun test ne doit dépendre du réseau
3. **Rapidité** : Tous les tests doivent s'exécuter en < 5 secondes
4. **Clarté** : Chaque test doit avoir un nom descriptif en français

## ⚡ Bonnes Pratiques

### ✅ À Faire

- Utiliser des noms de tests descriptifs en français
- Mocker toutes les dépendances externes
- Tester les cas d'erreur
- Nettoyer les mocks après chaque test
- Grouper les tests par fonctionnalité

### ❌ À Éviter

- Faire de vrais appels HTTP
- Tests dépendants de l'ordre d'exécution
- Tests qui modifient des fichiers réels
- Assertions trop génériques
- Tests sans assertions

## 🔧 Configuration IDE

### VS Code

Installer l'extension Jest pour VS Code pour :

- Exécution des tests en un clic
- Debugging intégré
- Couverture en temps réel

### Debugging

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```
