import { SmartDepartmentExtractor } from '../src/smartExtractor.js';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';

// Mock fs/promises et sharp
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}));

jest.mock('sharp', () => {
  const mockSharp = {
    raw: jest.fn().mockReturnThis(),
    ensureAlpha: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn(),
    metadata: jest.fn(),
  };
  return jest.fn(() => mockSharp);
});

const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

describe('SmartDepartmentExtractor', () => {
  let extractor: SmartDepartmentExtractor;
  const mockImagePath = '/test/path/image.png';
  const mockSpeciesName = 'Test Species';

  beforeEach(() => {
    extractor = new SmartDepartmentExtractor(mockImagePath, mockSpeciesName);
    mockWriteFile.mockClear();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(extractor).toBeInstanceOf(SmartDepartmentExtractor);
      expect((extractor as any).imagePath).toBe(mockImagePath);
      expect((extractor as any).speciesName).toBe(mockSpeciesName);
    });
  });

  describe('extractDepartmentDistribution', () => {
    it('should extract distribution data successfully', async () => {
      // Mock des métadonnées de l'image
      const mockMetadata = {
        width: 1024,
        height: 768,
        channels: 3,
      };

      // Mock d'un buffer d'image simple (rouge pur pour test)
      const mockImageBuffer = Buffer.alloc(1024 * 768 * 3);
      // Remplir avec du rouge (255, 0, 0) pour certains pixels
      for (let i = 0; i < 100; i++) {
        mockImageBuffer[i * 3] = 150; // R
        mockImageBuffer[i * 3 + 1] = 203; // G
        mockImageBuffer[i * 3 + 2] = 155; // B - Couleur verte "assez commune"
      }

      const mockSharpInstance = {
        raw: jest.fn().mockReturnThis(),
        ensureAlpha: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
        metadata: jest.fn().mockResolvedValue(mockMetadata),
      };

      (mockSharp as any).mockReturnValue(mockSharpInstance);

      await extractor.extractDepartmentDistribution();

      // Vérifier que Sharp a été appelé avec le bon chemin
      expect(mockSharp).toHaveBeenCalledWith(mockImagePath);
      expect(mockSharpInstance.metadata).toHaveBeenCalled();
      expect(mockSharpInstance.raw).toHaveBeenCalled();
      expect(mockSharpInstance.ensureAlpha).toHaveBeenCalled();
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();

      // Vérifier que les fichiers ont été sauvegardés
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      
      // Vérifier le fichier de détails
      const detailsCall = mockWriteFile.mock.calls.find(call => 
        call[0].toString().includes('department-extraction.json')
      );
      expect(detailsCall).toBeDefined();
      
      // Vérifier le fichier de distribution
      const distributionCall = mockWriteFile.mock.calls.find(call => 
        call[0].toString().includes('distribution.json')
      );
      expect(distributionCall).toBeDefined();
    });

    it('should handle image processing errors', async () => {
      const mockSharpInstance = {
        raw: jest.fn().mockReturnThis(),
        ensureAlpha: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Image processing failed')),
        metadata: jest.fn().mockResolvedValue({ width: 1024, height: 768, channels: 3 }),
      };

      (mockSharp as any).mockReturnValue(mockSharpInstance);

      await expect(extractor.extractDepartmentDistribution()).rejects.toThrow('Image processing failed');
    });
  });

  describe('analyzeColorAtCoordinates', () => {
    it('should analyze color correctly for given coordinates', () => {
      const mockImageData = {
        data: Buffer.alloc(1024 * 768 * 3),
        info: { width: 1024, height: 768, channels: 3 },
      };

      // Simuler une couleur verte aux coordonnées spécifiques
      const targetIndex = (100 * 1024 + 200) * 3; // Position (200, 100) 
      mockImageData.data[targetIndex] = 150;     // R
      mockImageData.data[targetIndex + 1] = 203; // G
      mockImageData.data[targetIndex + 2] = 155; // B

      const result = (extractor as any).analyzeColorAtCoordinates(
        mockImageData,
        { x: 200, y: 100 },
        30 // radius
      );

      expect(result).toHaveProperty('dominantColor');
      expect(result.dominantColor).toEqual({
        r: 150,
        g: 203,
        b: 155,
        hex: '#96cb9b',
      });
    });

    it('should return null for transparent areas', () => {
      const mockImageData = {
        data: Buffer.alloc(1024 * 768 * 3),
        info: { width: 1024, height: 768, channels: 3 },
      };

      // Laisser les données à 0 (noir transparent par défaut)
      const result = (extractor as any).analyzeColorAtCoordinates(
        mockImageData,
        { x: 200, y: 100 },
        30
      );

      expect(result.dominantColor).toBeNull();
    });
  });

  describe('getDominantColor', () => {
    it('should find dominant color in pixel array', () => {
      const pixels = [
        { r: 150, g: 203, b: 155 }, // Cette couleur apparaît 3 fois
        { r: 150, g: 203, b: 155 },
        { r: 150, g: 203, b: 155 },
        { r: 255, g: 255, b: 255 }, // Cette couleur apparaît 1 fois
        { r: 200, g: 100, b: 50 },  // Cette couleur apparaît 1 fois
      ];

      const result = (extractor as any).getDominantColor(pixels);

      expect(result).toEqual({
        r: 150,
        g: 203,
        b: 155,
        hex: '#96cb9b',
      });
    });

    it('should return null for empty pixel array', () => {
      const result = (extractor as any).getDominantColor([]);
      expect(result).toBeNull();
    });
  });

  describe('colorToHex', () => {
    it('should convert RGB to hex correctly', () => {
      const hex = (extractor as any).colorToHex(150, 203, 155);
      expect(hex).toBe('#96cb9b');
    });

    it('should handle edge cases', () => {
      expect((extractor as any).colorToHex(0, 0, 0)).toBe('#000000');
      expect((extractor as any).colorToHex(255, 255, 255)).toBe('#ffffff');
      expect((extractor as any).colorToHex(16, 32, 48)).toBe('#102030');
    });
  });

  describe('cleanSpeciesName', () => {
    it('should clean species names correctly', () => {
      expect((extractor as any).cleanSpeciesName('Barbastelle D\'Europe')).toBe('barbastelle-deurope');
      expect((extractor as any).cleanSpeciesName('Murin à Oreilles Échancrées')).toBe('murin-a-oreilles-echancrees');
      expect((extractor as any).cleanSpeciesName('Grand Murin')).toBe('grand-murin');
      expect((extractor as any).cleanSpeciesName('Pipistrelle de Kuhl')).toBe('pipistrelle-de-kuhl');
    });

    it('should handle special characters', () => {
      expect((extractor as any).cleanSpeciesName('Espèce-Têst Àvec Çaractères')).toBe('espece-test-avec-caracteres');
    });
  });

  describe('generateFileName', () => {
    it('should generate correct file names', () => {
      const extractor = new SmartDepartmentExtractor('/test/image.png', 'Grand Murin');
      
      const detailsName = (extractor as any).generateFileName('department-extraction');
      const distributionName = (extractor as any).generateFileName('distribution');
      
      expect(detailsName).toBe('grand-murin-department-extraction.json');
      expect(distributionName).toBe('grand-murin-distribution.json');
    });
  });

  describe('departments data', () => {
    it('should have coordinates for all French departments', () => {
      const departments = (extractor as any).departments;
      
      expect(departments).toHaveLength(94); // 95 départements - Corse (20)
      
      // Vérifier quelques départements clés
      const ain = departments.find((d: any) => d.code === '01');
      expect(ain).toBeDefined();
      expect(ain.name).toBe('Ain');
      expect(ain.region).toBe('Auvergne-Rhône-Alpes');
      expect(ain.approximateCoords).toHaveProperty('x');
      expect(ain.approximateCoords).toHaveProperty('y');
      
      const paris = departments.find((d: any) => d.code === '75');
      expect(paris).toBeDefined();
      expect(paris.name).toBe('Paris');
      
      // Vérifier que les coordonnées sont dans la plage valide [0, 1]
      departments.forEach((dept: any) => {
        expect(dept.approximateCoords.x).toBeGreaterThanOrEqual(0);
        expect(dept.approximateCoords.x).toBeLessThanOrEqual(1);
        expect(dept.approximateCoords.y).toBeGreaterThanOrEqual(0);
        expect(dept.approximateCoords.y).toBeLessThanOrEqual(1);
      });
    });
  });
});
