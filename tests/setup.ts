// Configuration globale des tests
// (Plus besoin de nock, on utilise globalThis.fetch natif avec des mocks Jest)

// Définir répertoires isolés pour les tests afin de ne jamais toucher aux dossiers réels
const TEST_OUTPUT_DIR = 'output_test';
const TEST_IMAGES_DIR = 'images_test';
process.env.BATEXTRACT_TEST_OUTPUT_DIR = TEST_OUTPUT_DIR;
process.env.BATEXTRACT_TEST_IMAGES_DIR = TEST_IMAGES_DIR;

// Garde-fou: empêcher tout appel réseau réel si un test oublie de mocker fetch
beforeAll(() => {
  const original = globalThis.fetch;
  Object.defineProperty(globalThis, '__ORIGINAL_FETCH__', { value: original, writable: false, configurable: true });
  globalThis.fetch = ((..._args: any[]) => {
    throw new Error('Fetch non mocké détecté – ajouter un mock dans le test.');
  }) as any;
});

// Mock console.log pour éviter le spam dans les tests
beforeAll(() => {
  const originalLog = console.log;
  console.log = jest.fn();
  // Gardons console.error pour les vraies erreurs
  
  // Si on veut voir les logs pendant le développement des tests
  if (process.env['DEBUG_TESTS']) {
    console.log = originalLog;
  }
});

// Préparer dossiers tests
beforeAll(() => {
  const fs = require('fs');
  try { if (!fs.existsSync(TEST_OUTPUT_DIR)) fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true }); } catch { /* ignore */ }
  try { if (!fs.existsSync(TEST_IMAGES_DIR)) fs.mkdirSync(TEST_IMAGES_DIR, { recursive: true }); } catch { /* ignore */ }
});

// Nettoyer les mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Nettoyage final uniquement sur les dossiers tests
afterAll(() => {
  try {
    const fs = require('fs');
    const path = require('path');
    for (const dir of [TEST_OUTPUT_DIR, TEST_IMAGES_DIR]) {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        try { fs.unlinkSync(path.join(dir, file)); } catch { /* ignore */ }
      }
    }
  } catch {
    // Ignorer toute erreur de cleanup (n'affecte pas la validité des tests)
  }
});
