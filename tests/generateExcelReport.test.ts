import { ExcelReportGenerator } from '../src/generateExcelReport.js';
import { readdir, readFile } from 'fs/promises';
import ExcelJS from 'exceljs';

// Mock fs/promises et ExcelJS
jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock('exceljs', () => {
  const mockWorksheet = {
    addRow: jest.fn(),
    getColumn: jest.fn(() => ({ width: 0 })),
    getCell: jest.fn(() => ({
      value: '',
      font: {},
      fill: {},
      alignment: {},
      border: {},
    })),
    mergeCells: jest.fn(),
    views: [],
    columns: [],
  };

  const mockWorkbook = {
    addWorksheet: jest.fn(() => mockWorksheet),
    xlsx: {
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-data')),
    },
  };

  return {
    __esModule: true,
    default: {
      Workbook: jest.fn(() => mockWorkbook),
    },
  };
});

const mockReaddir = readdir as jest.MockedFunction<typeof readdir>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('ExcelReportGenerator', () => {
  let generator: ExcelReportGenerator;
  let mockWorkbook: any;
  let mockWorksheet: any;

  beforeEach(() => {
    generator = new ExcelReportGenerator();
    jest.clearAllMocks();

    // Setup mock workbook and worksheet
    mockWorksheet = {
      getColumn: jest.fn(() => ({ width: 0 })),
      getCell: jest.fn(() => ({
        value: '',
        font: {},
        fill: {},
        alignment: {},
        border: {},
      })),
      mergeCells: jest.fn(),
      views: [],
    };

    mockWorkbook = {
      addWorksheet: jest.fn(() => mockWorksheet),
      xlsx: {
        writeFile: jest.fn(),
      },
    };

    (ExcelJS as any).mockReturnValue(mockWorkbook);
  });

  describe('generateReport', () => {
    beforeEach(() => {
      // Mock des fichiers JSON d'extraction
      mockReaddir.mockResolvedValue([
        'barbastelle-deurope-distribution.json',
        'grand-murin-distribution.json',
        'consolidated-species-report.json', // Ce fichier sera ignoré
        'other-file.txt', // Ce fichier sera ignoré
      ] as any);

      const mockBarbastelleData = [
        {
          department: { code: '01', name: 'Ain' },
          distributionStatus: 'assez commune à très commune',
          dominantColor: { hex: '#95cb9b' },
        },
        {
          department: { code: '02', name: 'Aisne' },
          distributionStatus: 'rare ou assez rare',
          dominantColor: { hex: '#f7a923' },
        },
      ];

      const mockGrandMurinData = [
        {
          department: { code: '01', name: 'Ain' },
          distributionStatus: 'peu commune ou localement commune',
          dominantColor: { hex: '#dbe7b0' },
        },
      ];

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockBarbastelleData))
        .mockResolvedValueOnce(JSON.stringify(mockGrandMurinData));
    });

    it('should generate Excel report successfully', async () => {
      await generator.generateReport();

      // Vérifier que les fichiers ont été lus
      expect(mockReaddir).toHaveBeenCalled();
      expect(mockReadFile).toHaveBeenCalledTimes(2);

      // Vérifier que le workbook a été créé
      expect(ExcelJS).toHaveBeenCalled();

      // Vérifier que les feuilles ont été créées
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Distribution par Département');
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Légende');

      // Vérifier que le fichier a été sauvegardé
      expect(mockWorkbook.xlsx.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('bat-distribution-matrix.xlsx')
      );
    });

    it('should handle empty species data', async () => {
      mockReaddir.mockResolvedValue([] as any);

      await expect(generator.generateReport()).rejects.toThrow(
        "Aucune donnée d'espèce trouvée dans le dossier output/"
      );
    });

    it('should handle file reading errors', async () => {
      mockReaddir.mockResolvedValue(['invalid-file.json'] as any);
      mockReadFile.mockRejectedValue(new Error('File read error'));

      // Should not throw but continue with empty data
      await expect(generator.generateReport()).rejects.toThrow(
        "Aucune donnée d'espèce trouvée dans le dossier output/"
      );
    });
  });

  describe('loadAllSpeciesData', () => {
    it('should load and transform species data correctly', async () => {
      mockReaddir.mockResolvedValue([
        'barbastelle-deurope-distribution.json',
        'consolidated-species-report.json', // Should be ignored
      ] as any);

      const mockData = [
        {
          department: { code: '01', name: 'Ain' },
          distributionStatus: 'assez commune à très commune',
          dominantColor: { hex: '#95cb9b' },
        },
      ];

      mockReadFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await (generator as any).loadAllSpeciesData();

      expect(result).toHaveLength(1);
      expect(result[0].speciesName).toBe("Barbastelle d'Europe");
      expect(result[0].departments['01']).toEqual({
        name: 'Ain',
        distributionStatus: 'assez commune à très commune',
        color: { hex: '#95cb9b' },
      });
    });

    it('should handle different data formats', async () => {
      mockReaddir.mockResolvedValue(['test-species-distribution.json'] as any);

      const mockDataWithDepartments = {
        departments: [
          {
            code: '01',
            name: 'Ain',
            distributionStatus: 'peu commune ou localement commune',
            color: { hex: '#dbe7b0' },
          },
        ],
      };

      mockReadFile.mockResolvedValue(JSON.stringify(mockDataWithDepartments));

      const result = await (generator as any).loadAllSpeciesData();

      expect(result).toHaveLength(1);
      expect(result[0].departments['01']).toEqual({
        name: 'Ain',
        distributionStatus: 'peu commune ou localement commune',
        color: { hex: '#dbe7b0' },
      });
    });
  });

  describe('extractSpeciesNameFromFilename', () => {
    it('should extract species names correctly', () => {
      expect((generator as any).extractSpeciesNameFromFilename('barbastelle-deurope-distribution.json'))
        .toBe("Barbastelle d'Europe");
      
      expect((generator as any).extractSpeciesNameFromFilename('murin-dalcathoe-distribution.json'))
        .toBe("Murin d'Alcathoe");
      
      expect((generator as any).extractSpeciesNameFromFilename('grand-murin-distribution.json'))
        .toBe('Grand Murin');
      
      expect((generator as any).extractSpeciesNameFromFilename('cote-dor-distribution.json'))
        .toBe("Cote D'Or");
    });
  });

  describe('getAllDepartmentCodes', () => {
    it('should return all French department codes', () => {
      const departments = (generator as any).getAllDepartmentCodes();
      
      expect(departments).toHaveLength(94); // 95 - Corse (20)
      expect(departments).toContain('01');
      expect(departments).toContain('19');
      expect(departments).toContain('21'); // Pas de 20
      expect(departments).toContain('95');
      expect(departments).not.toContain('20'); // Corse exclue
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect((generator as any).getStatusColor('très rarement inventoriée'))
        .toBe('FFEA5257');
      
      expect((generator as any).getStatusColor('rare ou assez rare'))
        .toBe('FFF7A923');
      
      expect((generator as any).getStatusColor('peu commune ou localement commune'))
        .toBe('FFDBE7B0');
      
      expect((generator as any).getStatusColor('assez commune à très commune'))
        .toBe('FF95CB9B');
      
      expect((generator as any).getStatusColor('unknown status'))
        .toBe('FFCCCCCC'); // Default color
    });
  });

  describe('getStatusShortCode', () => {
    it('should return correct short codes for different statuses', () => {
      expect((generator as any).getStatusShortCode('très rarement inventoriée'))
        .toBe('TR');
      
      expect((generator as any).getStatusShortCode('rare ou assez rare'))
        .toBe('R');
      
      expect((generator as any).getStatusShortCode('peu commune ou localement commune'))
        .toBe('PC');
      
      expect((generator as any).getStatusShortCode('assez commune à très commune'))
        .toBe('AC');
      
      expect((generator as any).getStatusShortCode('présente mais mal connue'))
        .toBe('PMC');
      
      expect((generator as any).getStatusShortCode('disparue ou non retrouvée'))
        .toBe('D');
      
      expect((generator as any).getStatusShortCode('absente'))
        .toBe('A');
      
      expect((generator as any).getStatusShortCode('unknown status'))
        .toBe('?'); // Default code
    });
  });

  describe('createDataMatrix', () => {
    it('should create data matrix with correct structure', async () => {
      const mockSpeciesData = [
        {
          speciesName: 'Test Species',
          departments: {
            '01': {
              name: 'Ain',
              distributionStatus: 'assez commune à très commune',
              color: { hex: '#95cb9b' },
            },
          },
        },
      ];

      await (generator as any).createDataMatrix(mockWorkbook, mockSpeciesData);

      // Vérifier que getCell a été appelé pour créer la matrice
      expect(mockWorksheet.getCell).toHaveBeenCalled();
      expect(mockWorksheet.getColumn).toHaveBeenCalled();
    });
  });

  describe('createLegendSheet', () => {
    it('should create legend sheet successfully', async () => {
      await (generator as any).createLegendSheet(mockWorkbook);

      // Vérifier que la feuille de légende a été configurée
      expect(mockWorksheet.getCell).toHaveBeenCalled();
      expect(mockWorksheet.mergeCells).toHaveBeenCalled();
    });
  });
});
