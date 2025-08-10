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
    toBuffer: jest.fn(),
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
      const width = 200;
      const height = 100;
      // Buffer RGB (3 canaux) rempli de 0
      const mockImageBuffer = Buffer.alloc(width * height * 3, 0);
      // Injecter une couleur significative (150,203,155) dans une zone pour qu'au moins un département la détecte
      for (let i = 0; i < 500; i++) {
        mockImageBuffer[i * 3] = 150;
        mockImageBuffer[i * 3 + 1] = 203;
        mockImageBuffer[i * 3 + 2] = 155;
      }

      const mockSharpInstance = {
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({ data: mockImageBuffer, info: { width, height } }),
      };
      (mockSharp as any).mockReturnValue(mockSharpInstance);

      const result = await extractor.extractDepartmentDistribution();

      expect(mockSharp).toHaveBeenCalledWith(mockImagePath);
      expect(mockSharpInstance.raw).toHaveBeenCalled();
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();

      // Un seul fichier de résultats détaillés est écrit
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const outputCall = mockWriteFile.mock.calls[0][0].toString();
      expect(outputCall).toContain('department-extraction.json');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should propagate image processing errors', async () => {
      const mockSharpInstance = {
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('Image processing failed')),
      };
      (mockSharp as any).mockReturnValue(mockSharpInstance);

      await expect(extractor.extractDepartmentDistribution()).rejects.toThrow('Image processing failed');
    });
  });

  describe('departments data', () => {
    it('should have coordinates for all French departments', () => {
      const departments = (extractor as any).departments;
      expect(departments).toHaveLength(94); // 95 départements sans le 20

      // Contrôles de base
      const ain = departments.find((d: any) => d.code === '01');
      expect(ain).toBeDefined();
      expect(ain.name).toBe('Ain');

      departments.forEach((dept: any) => {
        expect(dept.approximateCoords.x).toBeGreaterThanOrEqual(0);
        expect(dept.approximateCoords.x).toBeLessThanOrEqual(1);
        expect(dept.approximateCoords.y).toBeGreaterThanOrEqual(0);
        expect(dept.approximateCoords.y).toBeLessThanOrEqual(1);
      });
    });
  });
});
