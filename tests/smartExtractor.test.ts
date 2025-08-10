import { SmartDepartmentExtractor, SharpImageLoader } from '../src/smartExtractor.js';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';

// Mock fs/promises et sharp
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(), // Empêche la création réelle de fichiers dans output/
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

      // Un seul fichier de résultats détaillés est écrit (mocké, pas de persistance réelle)
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const outputCall = mockWriteFile.mock.calls[0][0].toString();
      expect(outputCall).toContain('department-extraction.json');
      // Aucun autre fichier parasite
      const callsExtra = mockWriteFile.mock.calls.map(c => c[0].toString());
      expect(callsExtra.every(p => p.includes('department-extraction'))).toBe(true);

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

  describe('inference & status mapping', () => {
    it('should infer distribution status from a synthetic buffer color', async () => {
      const width = 20; const height = 20;
      const buffer = Buffer.alloc(width * height * 3);
      for (let i = 0; i < buffer.length; i += 3) {
        buffer[i] = 150; buffer[i+1] = 203; buffer[i+2] = 155;
      }
      const mockSharpInstance = { raw: jest.fn().mockReturnThis(), toBuffer: jest.fn().mockResolvedValue({ data: buffer, info: { width, height } }) };
      (mockSharp as any).mockReturnValue(mockSharpInstance);
      const results = await extractor.extractDepartmentDistribution();
      const withColor = results.filter(r => r.dominantColor);
      expect(withColor.length).toBeGreaterThan(0);
      expect(withColor[0].distributionStatus).toBe('assez commune à très commune');
    });

    it('should mark all departments as non détecté for blank image', async () => {
      const width = 10; const height = 10;
      const buffer = Buffer.alloc(width * height * 3, 255);
      const mockSharpInstance = { raw: jest.fn().mockReturnThis(), toBuffer: jest.fn().mockResolvedValue({ data: buffer, info: { width, height } }) };
      (mockSharp as any).mockReturnValue(mockSharpInstance);
      const results = await extractor.extractDepartmentDistribution();
      expect(results.every(r => r.distributionStatus === 'non détecté')).toBe(true);
    });

    it('should set status to non détecté for an unmapped color present below threshold', async () => {
      const width = 15; const height = 15;
      // Couleur arbitraire non dans le mapping (#7b2d43) mais peu de pixels (<10)
      const buffer = Buffer.alloc(width * height * 3, 0);
      let painted = 0;
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) { // 9 pixels seulement
          const idx = (y * width + x) * 3;
          buffer[idx] = 123; buffer[idx+1] = 45; buffer[idx+2] = 67;
          painted++;
        }
      }
      const mockSharpInstance = { raw: jest.fn().mockReturnThis(), toBuffer: jest.fn().mockResolvedValue({ data: buffer, info: { width, height } }) };
      (mockSharp as any).mockReturnValue(mockSharpInstance);
      const results = await extractor.extractDepartmentDistribution();
      // Aucun département ne devrait avoir cette couleur dominante (seuil >10)
      expect(results.every(r => r.distributionStatus === 'non détecté')).toBe(true);
    });
  });

  describe('options & injection', () => {
    it('devrait utiliser un imageLoader injecté', async () => {
      const fakeData = Buffer.alloc(30 * 30 * 3, 0);
      // Peindre une couleur significative > threshold
      for (let i = 0; i < 400; i++) {
        fakeData[i * 3] = 150;
        fakeData[i * 3 + 1] = 203;
        fakeData[i * 3 + 2] = 155;
      }
      const mockLoader = { loadRaw: jest.fn().mockResolvedValue({ data: fakeData, width: 30, height: 30 }) };
      const custom = new SmartDepartmentExtractor('/tmp/img.png', 'Espèce Test', { imageLoader: mockLoader as any });
      const mappings = await custom.extractDepartmentDistribution();
      expect(mockLoader.loadRaw).toHaveBeenCalledTimes(1);
      expect(mappings.length).toBeGreaterThan(0);
    });

    it('devrait respecter un sampleRadius plus petit (moins de pixels examinés)', async () => {
      // Construire un buffer où seule une petite zone centrale a la couleur cible
      const size = 100;
      const buf = Buffer.alloc(size * size * 3, 255); // fond blanc ignoré
      // Petite zone  (10x10) couleur verte mappée
      for (let y = 45; y < 55; y++) {
        for (let x = 45; x < 55; x++) {
          const idx = (y * size + x) * 3;
          buf[idx] = 150; buf[idx + 1] = 203; buf[idx + 2] = 155;
        }
      }
      const mockLoader = { loadRaw: jest.fn().mockResolvedValue({ data: buf, width: size, height: size }) };

      const smallRadiusExtractor = new SmartDepartmentExtractor('/tmp/img.png', 'Test', { imageLoader: mockLoader as any, sampleRadius: 5 });
      const largeRadiusExtractor = new SmartDepartmentExtractor('/tmp/img.png', 'Test', { imageLoader: mockLoader as any, sampleRadius: 40 });

      const small = await smallRadiusExtractor.extractDepartmentDistribution();
      const large = await largeRadiusExtractor.extractDepartmentDistribution();

      // Avec un petit rayon, moins de départements auront une couleur dominante détectée
      const smallDetected = small.filter(m => m.dominantColor).length;
      const largeDetected = large.filter(m => m.dominantColor).length;
      expect(largeDetected).toBeGreaterThanOrEqual(smallDetected);
    });

    it('devrait respecter un minPixelThreshold élevé (aucune détection)', async () => {
      const size = 40;
      const buf = Buffer.alloc(size * size * 3, 0);
      // Peindre 30 pixels d'une couleur mappée
      for (let i = 0; i < 30; i++) {
        buf[i * 3] = 150; buf[i * 3 + 1] = 203; buf[i * 3 + 2] = 155;
      }
      const mockLoader = { loadRaw: jest.fn().mockResolvedValue({ data: buf, width: size, height: size }) };
      const highThresholdExtractor = new SmartDepartmentExtractor('/tmp/img.png', 'Test', { imageLoader: mockLoader as any, minPixelThreshold: 200 });
      const mappings = await highThresholdExtractor.extractDepartmentDistribution();
      expect(mappings.every(m => m.distributionStatus === 'non détecté')).toBe(true);
    });
  });
});
