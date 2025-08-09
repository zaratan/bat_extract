import * as nock from 'nock';
import { promises as fs } from 'fs';
import * as path from 'path';
import { mockMainPageHtml, mockGeneratedSpeciesData } from '../mocks/data';

// Mock du module fs pour éviter les écritures de fichiers réelles
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn()
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('generateSpeciesData', () => {
  const BASE_URL = 'https://plan-actions-chiropteres.fr';
  
  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();
    mockFs.access.mockResolvedValue(undefined);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('devrait extraire correctement les données d\'espèces depuis le site web', async () => {
    // Arrange - Configuration du mock HTTP
    const scope = nock(BASE_URL)
      .get('/les-especes/')
      .reply(200, mockMainPageHtml);

    // Importer dynamiquement le module à tester
    const generateModule = await import('../../src/generateSpeciesData');
    const { generateSpeciesFromWebsite } = generateModule;

    // Act - Exécution de la fonction
    const result = await generateSpeciesFromWebsite();

    // Assert - Vérifications
    expect(scope.isDone()).toBe(true);
    expect(result.species).toHaveLength(3);
    
    // Vérifier la première espèce (prioritaire)
    expect(result.species[0]).toEqual({
      name: "Barbastelle d'Europe",
      slug: 'barbastelle-deurope',
      url: `${BASE_URL}/barbastelle-deurope/`,
      isPriority: true
    });

    // Vérifier les métadonnées
    expect(result.metadata.totalSpecies).toBe(3);
    expect(result.metadata.prioritySpecies).toBe(2);
    expect(result.metadata.nonPrioritySpecies).toBe(1);
    expect(result.metadata.priorityPercentage).toBe(67);
  });

  it('devrait sauvegarder les données dans le fichier de sortie', async () => {
    // Arrange
    nock(BASE_URL)
      .get('/les-especes/')
      .reply(200, mockMainPageHtml);

    const { main } = await import('../../src/generateSpeciesData.js');

    // Act
    await main();

    // Assert - Vérifier que le fichier a été sauvegardé
    expect(mockFs.mkdir).toHaveBeenCalledWith(
      path.join(process.cwd(), 'output'),
      { recursive: true }
    );
    
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      path.join(process.cwd(), 'output', 'generated-species-data.json'),
      expect.stringContaining('"name":"Barbastelle d\'Europe"'),
      'utf-8'
    );
  });

  it('devrait gérer les erreurs de réseau gracieusement', async () => {
    // Arrange - Simuler une erreur réseau
    nock(BASE_URL)
      .get('/les-especes/')
      .replyWithError('Erreur de connexion');

    const { generateSpeciesFromWebsite } = await import('../../src/generateSpeciesData.js');

    // Act & Assert
    await expect(generateSpeciesFromWebsite()).rejects.toThrow();
  });

  it('devrait filtrer correctement les espèces prioritaires', async () => {
    // Arrange
    nock(BASE_URL)
      .get('/les-especes/')
      .reply(200, mockMainPageHtml);

    const { generateSpeciesFromWebsite } = await import('../../src/generateSpeciesData.js');

    // Act
    const result = await generateSpeciesFromWebsite();

    // Assert
    const prioritySpecies = result.species.filter(s => s.isPriority);
    const nonPrioritySpecies = result.species.filter(s => !s.isPriority);
    
    expect(prioritySpecies).toHaveLength(2);
    expect(nonPrioritySpecies).toHaveLength(1);
    
    expect(prioritySpecies[0].name).toBe("Barbastelle d'Europe");
    expect(prioritySpecies[1].name).toBe("Grand Murin");
    expect(nonPrioritySpecies[0].name).toBe("Pipistrelle commune");
  });

  it('devrait générer des URLs et slugs corrects', async () => {
    // Arrange
    nock(BASE_URL)
      .get('/les-especes/')
      .reply(200, mockMainPageHtml);

    const { generateSpeciesFromWebsite } = await import('../../src/generateSpeciesData.js');

    // Act
    const result = await generateSpeciesFromWebsite();

    // Assert
    result.species.forEach(species => {
      expect(species.slug).toMatch(/^[a-z0-9-]+$/); // Slug valide
      expect(species.url).toStartWith(BASE_URL);
      expect(species.url).toEndWith('/');
      expect(species.name).toBeTruthy();
    });
  });
});
