import { MapDownloader } from '../src/downloadMaps.js';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import nock from 'nock';

// Mock fs modules
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('MapDownloader', () => {
  let downloader: MapDownloader;

  beforeEach(() => {
    downloader = new MapDownloader();
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('downloadAllMaps', () => {
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

      // Mock des URLs découvertes
      const mockDiscoveredUrls = {
        validImageUrls: {
          'barbastelle-deurope': 'https://plan-actions-chiropteres.fr/wp-content/uploads/barbastelle-carte.png',
          'grand-murin': 'https://plan-actions-chiropteres.fr/wp-content/uploads/grand-murin-carte.png',
        },
      };

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockSpeciesData))
        .mockResolvedValueOnce(JSON.stringify(mockDiscoveredUrls));
    });

    it('should download all maps successfully', async () => {
      // Mock que les fichiers n'existent pas encore
      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);

      // Mock des téléchargements d'images
      const mockImageBuffer = Buffer.from('fake-image-data');
      
      nock('https://plan-actions-chiropteres.fr')
        .get('/wp-content/uploads/barbastelle-carte.png')
        .reply(200, mockImageBuffer);

      nock('https://plan-actions-chiropteres.fr')
        .get('/wp-content/uploads/grand-murin-carte.png')
        .reply(200, mockImageBuffer);

      await downloader.downloadAllMaps();

      // Vérifier que le dossier images a été créé
      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('images'), { recursive: true });

      // Vérifier que les images ont été sauvegardées
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      
      const writeFileCalls = mockWriteFile.mock.calls;
      expect(writeFileCalls[0][0]).toContain('barbastelle-deurope');
      expect(writeFileCalls[0][1]).toBe(mockImageBuffer);
      expect(writeFileCalls[1][0]).toContain('grand-murin');
      expect(writeFileCalls[1][1]).toBe(mockImageBuffer);
    });

    it('should skip existing files', async () => {
      // Mock que les fichiers existent déjà
      mockExistsSync.mockReturnValue(true);

      await downloader.downloadAllMaps();

      // Vérifier qu'aucun téléchargement n'a eu lieu
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should handle download errors gracefully', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);

      // Mock d'une erreur de téléchargement
      nock('https://plan-actions-chiropteres.fr')
        .get('/wp-content/uploads/barbastelle-carte.png')
        .reply(404, 'Not Found');

      nock('https://plan-actions-chiropteres.fr')
        .get('/wp-content/uploads/grand-murin-carte.png')
        .reply(200, Buffer.from('fake-image-data'));

      // Le téléchargement ne devrait pas lever d'erreur mais continuer
      await expect(downloader.downloadAllMaps()).resolves.not.toThrow();

      // Vérifier qu'au moins un fichier a été téléchargé
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('should download only priority species when specified', async () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);

      const mockImageBuffer = Buffer.from('fake-image-data');
      
      nock('https://plan-actions-chiropteres.fr')
        .get('/wp-content/uploads/barbastelle-carte.png')
        .reply(200, mockImageBuffer);

      await downloader.downloadPriorityMaps();

      // Vérifier que seule l'espèce prioritaire a été téléchargée
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(mockWriteFile.mock.calls[0][0]).toContain('barbastelle-deurope');
    });
  });

  describe('generateImageFilename', () => {
    it('should generate correct filenames', () => {
      const filename1 = (downloader as any).generateImageFilename(
        'barbastelle-deurope',
        'https://plan-actions-chiropteres.fr/wp-content/uploads/barbastelle-carte-2048x1271.png'
      );
      expect(filename1).toBe('plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png');

      const filename2 = (downloader as any).generateImageFilename(
        'grand-murin',
        'https://plan-actions-chiropteres.fr/wp-content/uploads/grand-murin-distribution.png'
      );
      expect(filename2).toBe('plan-actions-chiropteres.fr-grand-murin-carte-grand-murin.png');
    });

    it('should handle various URL formats', () => {
      const filename = (downloader as any).generateImageFilename(
        'test-species',
        'https://example.com/images/test-image.jpg'
      );
      expect(filename).toBe('example.com-test-species-carte-test-species.jpg');
    });
  });

  describe('downloadImage', () => {
    it('should download and save image successfully', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const url = 'https://example.com/test-image.png';
      const filename = 'test-image.png';

      nock('https://example.com')
        .get('/test-image.png')
        .reply(200, mockImageBuffer);

      await (downloader as any).downloadImage(url, filename);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining(filename),
        mockImageBuffer
      );
    });

    it('should handle download failures', async () => {
      const url = 'https://example.com/test-image.png';
      const filename = 'test-image.png';

      nock('https://example.com')
        .get('/test-image.png')
        .reply(500, 'Server Error');

      // Should not throw but log error
      await expect((downloader as any).downloadImage(url, filename)).resolves.not.toThrow();
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe('loadSpeciesData', () => {
    it('should load species data correctly', async () => {
      const mockData = {
        metadata: { totalSpecies: 1 },
        species: [{ name: 'Test Species', slug: 'test-species' }],
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await (downloader as any).loadSpeciesData();
      expect(result).toEqual(mockData.species);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('generated-species-data.json'),
        'utf-8'
      );
    });

    it('should handle missing species data file', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect((downloader as any).loadSpeciesData()).rejects.toThrow('File not found');
    });
  });

  describe('loadDiscoveredUrls', () => {
    it('should load discovered URLs correctly', async () => {
      const mockUrls = {
        validImageUrls: { 'test-species': 'https://example.com/test.png' },
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockUrls));

      const result = await (downloader as any).loadDiscoveredUrls();
      expect(result).toEqual(mockUrls.validImageUrls);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('discovered-image-urls.json'),
        'utf-8'
      );
    });

    it('should handle missing discovered URLs file', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect((downloader as any).loadDiscoveredUrls()).rejects.toThrow('File not found');
    });
  });
});
