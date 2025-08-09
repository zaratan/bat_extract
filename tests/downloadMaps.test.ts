import { MapDownloader } from '../src/downloadMaps.js';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';

// Mock node-fetch to avoid ESM issues
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

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

// Import mockFetch after the mock is set up
import mockFetch from 'node-fetch';
const mockedFetch = mockFetch as jest.MockedFunction<typeof mockFetch>;

describe('MapDownloader', () => {
  let downloader: MapDownloader;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    downloader = new MapDownloader();
    jest.clearAllMocks();
    
    // Mock process.exit pour tous les tests
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exit called');
    });
    
    // Mock fetch to return successful responses
    mockedFetch.mockImplementation(() => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        body: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer.slice(mockImageBuffer.byteOffset, mockImageBuffer.byteOffset + mockImageBuffer.byteLength)),
      } as any);
    });
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  describe('downloadAllMaps', () => {
    it('should download all maps successfully', async () => {
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

      // Mock que les fichiers n'existent pas encore
      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);

      await downloader.downloadAllMaps();

      // Vérifier que le dossier images a été créé
      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('images'), { recursive: true });

      // Vérifier que les images ont été sauvegardées
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      
      const writeFileCalls = mockWriteFile.mock.calls;
      expect(writeFileCalls[0][0]).toContain('barbastelle-deurope');
      expect(writeFileCalls[1][0]).toContain('grand-murin');
    });

    it('should skip existing files', async () => {
      // Mock des données d'espèces
      const mockSpeciesData = {
        metadata: {
          generatedAt: '2025-08-09T10:00:00.000Z',
          source: 'https://plan-actions-chiropteres.fr',
          totalSpecies: 1,
          prioritySpecies: 0,
        },
        species: [
          {
            name: 'Test Species',
            slug: 'test-species',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/test-species/',
            isPriority: false,
          },
        ],
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockSpeciesData));

      // Mock que les fichiers existent déjà
      mockExistsSync.mockReturnValue(true);

      await downloader.downloadAllMaps();

      // Vérifier qu'aucun téléchargement n'a eu lieu
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should handle download errors gracefully', async () => {
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

      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);

      // Mock fetch pour simuler une erreur HTTP pour la première image
      mockedFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          body: false,
        } as any)
      ).mockImplementationOnce(() => {
        const mockImageBuffer = Buffer.from('fake-image-data');
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          body: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer.slice(mockImageBuffer.byteOffset, mockImageBuffer.byteOffset + mockImageBuffer.byteLength)),
        } as any);
      });

      // Le téléchargement ne devrait pas lever d'erreur mais continuer
      await expect(downloader.downloadAllMaps()).resolves.not.toThrow();

      // Vérifier qu'au moins un fichier a été téléchargé (le deuxième)
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('should handle missing species data file', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      // Le téléchargement devrait échouer avec process.exit(1)
      await expect(downloader.downloadAllMaps()).rejects.toThrow('Process exit called');
    });

    it('should handle missing discovered URLs file gracefully', async () => {
      // Mock des données d'espèces (succès)
      const mockSpeciesData = {
        metadata: {
          generatedAt: '2025-08-09T10:00:00.000Z',
          source: 'https://plan-actions-chiropteres.fr',
          totalSpecies: 1,
          prioritySpecies: 0,
        },
        species: [
          {
            name: 'Test Species',
            slug: 'test-species',
            pageUrl: 'https://plan-actions-chiropteres.fr/les-chauves-souris/les-especes/test-species/',
            isPriority: false,
          },
        ],
      };

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockSpeciesData))
        .mockRejectedValueOnce(new Error('URLs file not found'));

      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);

      await downloader.downloadAllMaps();

      // Vérifier que le téléchargement a bien eu lieu avec l'URL de fallback
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.stringContaining('test-species-carte-test-species')
      );
    });
  });

  describe('downloadPriorityMaps', () => {
    it('should download only priority species when specified', async () => {
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
        },
      };

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockSpeciesData))
        .mockResolvedValueOnce(JSON.stringify(mockDiscoveredUrls));

      mockExistsSync.mockReturnValue(false);
      mockMkdir.mockResolvedValue(undefined);

      await downloader.downloadPriorityMaps();

      // Vérifier que seule l'espèce prioritaire a été téléchargée
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(mockWriteFile.mock.calls[0][0]).toContain('barbastelle-deurope');
    });
  });
});
