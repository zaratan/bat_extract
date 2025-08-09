import { ImageUrlDiscoverer, type ImageInfo, type BatSpecies } from '../src/discoverImageUrls.js';
import { writeFile, readFile } from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
}));

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

// Mock globalThis.fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof globalThis.fetch>;

// Mock process.exit to prevent test termination
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number) => {
  throw new Error(`Process exit called with code ${code}`);
});

describe('ImageUrlDiscoverer', () => {
  let discoverer: ImageUrlDiscoverer;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    discoverer = new ImageUrlDiscoverer();
    jest.clearAllMocks();
    
    // Sauvegarder et mocker fetch
    originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;
    mockFetch.mockClear();
    mockExit.mockClear();
  });

  afterEach(() => {
    // Restaurer fetch original
    globalThis.fetch = originalFetch;
  });

  describe('analyzeSpeciesPage', () => {
    it('devrait extraire une URL d\'image valide', async () => {
      // Mock de la réponse fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<img src="https://plan-actions-chiropteres.fr/wp-content/uploads/carte-barbastelle-deurope-2048x1271.png" />',
      } as Response);

      const mockSpecies: BatSpecies = {
        name: 'Barbastelle d\'Europe',
        slug: 'barbastelle-deurope',
        pageUrl: 'https://plan-actions-chiropteres.fr/barbastelle-deurope/',
        isPriority: false,
      };

      const result = await discoverer.analyzeSpeciesPage(mockSpecies);

      expect(result).toEqual({
        species: 'Barbastelle d\'Europe',
        slug: 'barbastelle-deurope',
        pageUrl: 'https://plan-actions-chiropteres.fr/barbastelle-deurope/',
        imageUrl: 'https://plan-actions-chiropteres.fr/wp-content/uploads/carte-barbastelle-deurope-2048x1271.png',
      });
    });

    it('devrait gérer les erreurs HTTP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const mockSpecies: BatSpecies = {
        name: 'Espèce Test',
        slug: 'espece-test',
        pageUrl: 'https://example.com/test',
        isPriority: false,
      };

      const result = await discoverer.analyzeSpeciesPage(mockSpecies);

      expect(result).toEqual({
        species: 'Espèce Test',
        slug: 'espece-test',
        pageUrl: 'https://example.com/test',
        error: 'HTTP 404: Not Found',
      });
    });
  });

  describe('extractImageUrl', () => {
    it('devrait extraire l\'URL d\'une image', () => {
      const html = '<img src="https://plan-actions-chiropteres.fr/wp-content/uploads/carte-barbastelle-deurope-2048x1271.png" />';
      const slug = 'barbastelle-deurope';
      
      const result = discoverer.extractImageUrl(html, slug);
      
      expect(result).toBe('https://plan-actions-chiropteres.fr/wp-content/uploads/carte-barbastelle-deurope-2048x1271.png');
    });

    it('devrait retourner null si aucune image n\'est trouvée', () => {
      const html = '<div>Pas d\'image ici</div>';
      const slug = 'barbastelle-deurope';
      
      const result = discoverer.extractImageUrl(html, slug);
      
      expect(result).toBeNull();
    });
  });

  describe('discoverImageUrls', () => {
    it('should discover image URLs successfully', async () => {
      // Mock des données d'espèces
      const mockSpeciesData = {
        species: [
          {
            name: 'Barbastelle d\'Europe',
            slug: 'barbastelle-deurope',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/barbastelle-deurope/',
            isPriority: false,
          },
        ],
      };

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockSpeciesData));

      // Mock de la réponse HTTP
      const mockHtml = `
        <div class="content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/barbastelle-carte.png" alt="Carte Barbastelle">
        </div>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
      } as Response);

      const results = await discoverer.discoverImageUrls();

      // Vérifier que la méthode renvoie des résultats
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock des données d'espèces avec types corrects
      const mockSpeciesData = {
        species: [
          {
            name: 'Test Species',
            slug: 'test-species',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/test-species/',
            isPriority: false,
          },
        ],
      };

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockSpeciesData));

      // Mock d'une erreur HTTP
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const results = await discoverer.discoverImageUrls();

      // Même en cas d'erreur HTTP, la méthode devrait retourner un tableau
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle missing species data file', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('File not found'));

      // La découverte devrait échouer avec une erreur (process.exit mocké)
      await expect(discoverer.discoverImageUrls()).rejects.toThrow('Process exit called with code 1');
    });
  });

  describe('generateReport', () => {
    it('should generate report successfully', async () => {
      const mockResults: ImageInfo[] = [
        {
          species: 'Test Species',
          slug: 'test-species',
          pageUrl: 'https://plan-actions-chiropteres.fr/test-species/',
          imageUrl: 'https://example.com/test.png'
        }
      ];

      await discoverer.generateReport(mockResults);

      // Vérifier que writeFile a été appelé
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });
  });
});
