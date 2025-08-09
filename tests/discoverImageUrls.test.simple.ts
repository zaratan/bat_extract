import { ImageUrlDiscoverer } from '../src/discoverImageUrls.js';
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
  });

  afterEach(() => {
    // Restaurer fetch original
    globalThis.fetch = originalFetch;
  });

  describe('discoverUrls', () => {
    it('should discover image URLs successfully', async () => {
      // Mock des données d'espèces
      const mockSpeciesData = {
        species: [
          {
            name: 'Barbastelle d\'Europe',
            slug: 'barbastelle-deurope',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/barbastelle-deurope/',
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

      await discoverer.discoverImageUrls();

      // Vérifier que writeFile a été appelé
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      
      const [filePath, content] = mockWriteFile.mock.calls[0];
      expect(filePath).toContain('discovered-image-urls.json');
      
      const parsedContent = JSON.parse(content as string);
      expect(parsedContent).toHaveProperty('validImageUrls');
      expect(Object.keys(parsedContent.validImageUrls)).toContain('barbastelle-deurope');
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock des données d'espèces
      const mockSpeciesData = {
        species: [
          {
            name: 'Test Species',
            slug: 'test-species',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/test-species/',
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

      await discoverer.discoverImageUrls();

      // Vérifier que writeFile a été appelé malgré l'erreur
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('should handle missing species data file', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('File not found'));

      // La découverte devrait échouer avec une erreur
      await expect(discoverer.discoverImageUrls()).rejects.toThrow();
    });
  });

  describe('extractImageUrlsFromPage', () => {
    it('should extract image URLs from HTML', () => {
      const html = `
        <div class="content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/carte-test.png" alt="Carte">
          <img src="/wp-content/uploads/autre-image.jpg" alt="Autre">
        </div>
      `;

      const urls = (discoverer as any).extractImageUrlsFromPage(html, 'test-species');
      
      expect(urls).toHaveLength(2);
      expect(urls[0]).toContain('carte-test.png');
      expect(urls[1]).toContain('autre-image.jpg');
    });

    it('should handle HTML without images', () => {
      const html = '<div class="content"><p>Pas d\'images ici</p></div>';

      const urls = (discoverer as any).extractImageUrlsFromPage(html, 'test-species');
      
      expect(urls).toHaveLength(0);
    });
  });
});
