import nock from 'nock';

// Désactiver toutes les connexions HTTP réelles
nock.disableNetConnect();

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
  nock.cleanAll();
});

// Réactiver les connexions HTTP après tous les tests
afterAll(() => {
  nock.enableNetConnect();
});
