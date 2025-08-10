// Configuration globale des tests
// (Plus besoin de nock, on utilise globalThis.fetch natif avec des mocks Jest)

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

// Nettoyer les mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Plus de configuration spéciale pour les tests
afterAll(() => {
  // Nettoyage final si nécessaire
});
