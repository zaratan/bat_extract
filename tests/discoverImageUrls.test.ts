import { ImageUrlDiscoverer } from '../src/discoverImageUrls.js';
import { writeFile, readFile } from 'fs/promises';
import nock from 'nock';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
}));

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('ImageUrlDiscoverer', () => {
  let discoverer: ImageUrlDiscoverer;

  beforeEach(() => {
    discoverer = new ImageUrlDiscoverer();
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('discoverImageUrls', () => {
    beforeEach(() => {
      // Mock des données d'espèces
      const mockSpeciesData = {
        metadata: {
          generatedAt: '2025-08-09T10:00:00.000Z',
          source: 'https://plan-actions-chiropteres.fr',
          totalSpecies: 2,
          prioritySpecies: 1,
        },
        species: [
          {
            name: 'Barbastelle d\'Europe',
            slug: 'barbastelle-deurope',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/barbastelle-deurope/',
            isPriority: true,
          },
          {
            name: 'Grand Murin',
            slug: 'grand-murin',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/grand-murin/',
            isPriority: false,
          },
        ],
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockSpeciesData));
    });

    it('should discover image URLs successfully', async () => {
      // Mock des pages HTML avec images
      const mockBarbastelleHtml = `
        <div class="entry-content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/2023/01/barbastelle-carte-distribution.png" alt="Carte Barbastelle">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png" alt="Carte officielle">
        </div>
      `;

      const mockGrandMurinHtml = `
        <div class="entry-content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/plan-actions-chiropteres.fr-grand-murin-carte-grand-murin-2048x1271.png" alt="Carte Grand Murin">
        </div>
      `;

      nock('https://plan-actions-chiropteres.fr')
        .get('/les-chauves-souris/les-especes/barbastelle-deurope/')
        .reply(200, mockBarbastelleHtml);

      nock('https://plan-actions-chiropteres.fr')
        .get('/les-chauves-souris/les-especes/grand-murin/')
        .reply(200, mockGrandMurinHtml);

      await discoverer.discoverImageUrls();

      // Vérifier que les fichiers ont été sauvegardés
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      
      // Vérifier le fichier des URLs découvertes
      const discoveredUrlsCall = mockWriteFile.mock.calls.find(call => 
        call[0].toString().includes('discovered-image-urls.json')
      );
      expect(discoveredUrlsCall).toBeDefined();
      
      const discoveredUrlsContent = JSON.parse(discoveredUrlsCall![1] as string);
      expect(discoveredUrlsContent.validImageUrls).toHaveProperty('barbastelle-deurope');
      expect(discoveredUrlsContent.validImageUrls).toHaveProperty('grand-murin');
      
      // Vérifier le fichier du rapport détaillé
      const reportCall = mockWriteFile.mock.calls.find(call => 
        call[0].toString().includes('image-discovery-report.json')
      );
      expect(reportCall).toBeDefined();
    });

    it('should handle pages without images', async () => {
      const mockHtmlWithoutImage = `
        <div class="entry-content">
          <p>Pas d'image de carte sur cette page</p>
        </div>
      `;

      nock('https://plan-actions-chiropteres.fr')
        .get('/les-chauves-souris/les-especes/barbastelle-deurope/')
        .reply(200, mockHtmlWithoutImage);

      nock('https://plan-actions-chiropteres.fr')
        .get('/les-chauves-souris/les-especes/grand-murin/')
        .reply(200, mockHtmlWithoutImage);

      await discoverer.discoverImageUrls();

      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      
      const discoveredUrlsCall = mockWriteFile.mock.calls.find(call => 
        call[0].toString().includes('discovered-image-urls.json')
      );
      const content = JSON.parse(discoveredUrlsCall![1] as string);
      
      // Les espèces devraient être dans le rapport mais sans URLs valides
      expect(Object.keys(content.validImageUrls)).toHaveLength(0);
    });

    it('should handle HTTP errors gracefully', async () => {
      nock('https://plan-actions-chiropteres.fr')
        .get('/les-chauves-souris/les-especes/barbastelle-deurope/')
        .reply(404, 'Not Found');

      nock('https://plan-actions-chiropteres.fr')
        .get('/les-chauves-souris/les-especes/grand-murin/')
        .reply(200, '<div>Page sans image</div>');

      // Should not throw but continue processing
      await expect(discoverer.discoverImageUrls()).resolves.not.toThrow();
      
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('extractImageUrl', () => {
    it('should extract image URLs with exact pattern match', () => {
      const html = `
        <div class="entry-content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png" alt="Carte">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/other-image.png" alt="Autre">
        </div>
      `;

      const url = (discoverer as any).extractImageUrl(html, 'barbastelle-deurope');
      expect(url).toBe('https://plan-actions-chiropteres.fr/wp-content/uploads/plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png');
    });

    it('should extract URLs with carte prefix pattern', () => {
      const html = `
        <div class="entry-content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/carte-grand-murin-distribution.png" alt="Carte">
        </div>
      `;

      const url = (discoverer as any).extractImageUrl(html, 'grand-murin');
      expect(url).toBe('https://plan-actions-chiropteres.fr/wp-content/uploads/carte-grand-murin-distribution.png');
    });

    it('should extract URLs with various slug patterns', () => {
      const html = `
        <div class="entry-content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/murin-oreilles-echancrees-carte.png" alt="Carte">
        </div>
      `;

      const url = (discoverer as any).extractImageUrl(html, 'murin-a-oreilles-echancrees');
      expect(url).toBe('https://plan-actions-chiropteres.fr/wp-content/uploads/murin-oreilles-echancrees-carte.png');
    });

    it('should return null when no matching image found', () => {
      const html = `
        <div class="entry-content">
          <img src="https://plan-actions-chiropteres.fr/wp-content/uploads/other-species.png" alt="Autre espèce">
          <p>Pas d'image de carte pour cette espèce</p>
        </div>
      `;

      const url = (discoverer as any).extractImageUrl(html, 'espece-inexistante');
      expect(url).toBeNull();
    });

    it('should handle malformed HTML', () => {
      const html = '<div><img src="incomplete';

      const url = (discoverer as any).extractImageUrl(html, 'test-species');
      expect(url).toBeNull();
    });
  });

  describe('cleanSlugForPattern', () => {
    it('should clean slugs for pattern matching', () => {
      expect((discoverer as any).cleanSlugForPattern('barbastelle-deurope'))
        .toBe('barbastelle[\\s\\-]?d?[\\s\\-]?europe');
      
      expect((discoverer as any).cleanSlugForPattern('murin-a-oreilles-echancrees'))
        .toBe('murin[\\s\\-]?a?[\\s\\-]?oreilles[\\s\\-]?echancrees');
      
      expect((discoverer as any).cleanSlugForPattern('grand-murin'))
        .toBe('grand[\\s\\-]?murin');
    });

    it('should handle special characters', () => {
      expect((discoverer as any).cleanSlugForPattern('pipistrelle-de-kuhl'))
        .toBe('pipistrelle[\\s\\-]?de[\\s\\-]?kuhl');
    });
  });

  describe('fetchSpeciesPage', () => {
    it('should fetch species page successfully', async () => {
      const mockHtml = '<div>Test HTML content</div>';
      
      nock('https://plan-actions-chiropteres.fr')
        .get('/test-page/')
        .reply(200, mockHtml);

      const html = await (discoverer as any).fetchSpeciesPage('https://plan-actions-chiropteres.fr/test-page/');
      expect(html).toBe(mockHtml);
    });

    it('should handle fetch errors', async () => {
      nock('https://plan-actions-chiropteres.fr')
        .get('/test-page/')
        .reply(500, 'Server Error');

      const html = await (discoverer as any).fetchSpeciesPage('https://plan-actions-chiropteres.fr/test-page/');
      expect(html).toBeNull();
    });

    it('should handle network errors', async () => {
      nock('https://plan-actions-chiropteres.fr')
        .get('/test-page/')
        .replyWithError('Network error');

      const html = await (discoverer as any).fetchSpeciesPage('https://plan-actions-chiropteres.fr/test-page/');
      expect(html).toBeNull();
    });
  });

  describe('loadSpeciesData', () => {
    it('should load species data correctly', async () => {
      const mockData = {
        metadata: { totalSpecies: 1 },
        species: [{ name: 'Test Species', slug: 'test-species' }],
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await (discoverer as any).loadSpeciesData();
      expect(result).toEqual(mockData.species);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('generated-species-data.json'),
        'utf-8'
      );
    });

    it('should handle missing species data file', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect((discoverer as any).loadSpeciesData()).rejects.toThrow('File not found');
    });

    it('should handle invalid JSON', async () => {
      mockReadFile.mockResolvedValue('invalid json content');

      await expect((discoverer as any).loadSpeciesData()).rejects.toThrow();
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive report', () => {
      const imageInfos = [
        {
          species: 'Barbastelle d\'Europe',
          slug: 'barbastelle-deurope',
          pageUrl: 'https://plan-actions-chiropteres.fr/test/',
          imageUrl: 'https://plan-actions-chiropteres.fr/image.png',
        },
        {
          species: 'Grand Murin',
          slug: 'grand-murin',
          pageUrl: 'https://plan-actions-chiropteres.fr/test2/',
          error: 'Image not found',
        },
      ];

      const report = (discoverer as any).generateReport(imageInfos);

      expect(report.summary.totalSpecies).toBe(2);
      expect(report.summary.successfulUrls).toBe(1);
      expect(report.summary.failedUrls).toBe(1);
      expect(report.validImageUrls).toHaveProperty('barbastelle-deurope');
      expect(report.validImageUrls).not.toHaveProperty('grand-murin');
      expect(report.detailedResults).toHaveLength(2);
    });

    it('should handle empty results', () => {
      const report = (discoverer as any).generateReport([]);

      expect(report.summary.totalSpecies).toBe(0);
      expect(report.summary.successfulUrls).toBe(0);
      expect(report.summary.failedUrls).toBe(0);
      expect(Object.keys(report.validImageUrls)).toHaveLength(0);
    });
  });
});
