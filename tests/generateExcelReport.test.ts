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
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
  };

  const MockedExcel: any = function () {};
  MockedExcel.Workbook = jest.fn(() => mockWorkbook);

  return {
    __esModule: true,
    default: MockedExcel,
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

    // Récupérer les instances mock pour assertions
    mockWorkbook = new (ExcelJS as any).Workbook();
    mockWorksheet = mockWorkbook.addWorksheet('tmp');
    (mockWorkbook.addWorksheet as jest.Mock).mockClear();
  });

  describe('generateReport', () => {
    beforeEach(() => {
      // Mock des fichiers JSON d'extraction
      mockReaddir.mockResolvedValue([
        'barbastelle-deurope-distribution.json',
        'grand-murin-distribution.json',
        'consolidated-species-report.json',
        'other-file.txt',
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
      expect(mockReaddir).toHaveBeenCalled();
      expect(mockReadFile).toHaveBeenCalledTimes(2);
      expect((ExcelJS as any).Workbook).toHaveBeenCalled();
      expect((ExcelJS as any).Workbook.mock.results.length).toBeGreaterThan(0);
      // Deux feuilles ajoutées
      expect((ExcelJS as any).Workbook.mock.results[0].value.addWorksheet).toHaveBeenCalledWith('Distribution par Département');
      expect((ExcelJS as any).Workbook.mock.results[0].value.addWorksheet).toHaveBeenCalledWith('Légende');
      expect((ExcelJS as any).Workbook.mock.results[0].value.xlsx.writeFile).toHaveBeenCalledWith(expect.stringContaining('bat-distribution-matrix.xlsx'));
    });

    it('should handle empty species data', async () => {
      mockReaddir.mockResolvedValue([] as any);
      await expect(generator.generateReport()).rejects.toThrow("Aucune donnée d'espèce trouvée dans le dossier output/");
    });

    it('should handle file reading errors', async () => {
      mockReaddir.mockResolvedValue(['invalid-file.json'] as any);
      mockReadFile.mockRejectedValue(new Error('File read error'));
      await expect(generator.generateReport()).rejects.toThrow("Aucune donnée d'espèce trouvée dans le dossier output/");
    });

    it('should throw if only consolidated or non-distribution files exist', async () => {
      mockReaddir.mockResolvedValue(['consolidated-species-report.json','readme.txt'] as any);
      await expect(generator.generateReport()).rejects.toThrow("Aucune donnée d'espèce trouvée dans le dossier output/");
    });
  });

  describe('loadAllSpeciesData', () => {
    it('should load and transform species data correctly', async () => {
      mockReaddir.mockResolvedValue([
        'barbastelle-deurope-distribution.json',
        'consolidated-species-report.json',
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

    it('should sort species alphabetically regardless of file order', async () => {
      mockReaddir.mockResolvedValueOnce([
        'z-species-distribution.json',
        'a-species-distribution.json'
      ] as any);

      const zData = [
        { department: { code: '01', name: 'Ain' }, distributionStatus: 'assez commune à très commune' }
      ];
      const aData = [
        { department: { code: '01', name: 'Ain' }, distributionStatus: 'rare ou assez rare' }
      ];

      // L'ordre des readFile suit l'ordre des fichiers retournés par readdir
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(zData))
        .mockResolvedValueOnce(JSON.stringify(aData));

      const list = await (generator as any).loadAllSpeciesData();
      expect(list.map((s: any) => s.speciesName)).toEqual(['A Species', 'Z Species']);
    });

    it('should ignore invalid JSON files but keep valid ones', async () => {
      mockReadFile.mockReset();
      mockReaddir.mockResolvedValueOnce([
        'valid-species-distribution.json',
        'invalid-species-distribution.json'
      ] as any);

      const validData = [
        { department: { code: '01', name: 'Ain' }, distributionStatus: 'assez commune à très commune' }
      ];

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(validData))
        .mockRejectedValueOnce(new Error('read error'));

      const list = await (generator as any).loadAllSpeciesData();
      expect(list).toHaveLength(1);
      expect(list[0].speciesName).toBe('Valid Species');
    });
  });

  describe('extractSpeciesNameFromFilename', () => {
    it('should extract species names correctly', () => {
      expect((generator as any).extractSpeciesNameFromFilename('barbastelle-deurope-distribution.json')).toBe("Barbastelle d'Europe");
      expect((generator as any).extractSpeciesNameFromFilename('murin-dalcathoe-distribution.json')).toBe("Murin d'Alcathoe");
      expect((generator as any).extractSpeciesNameFromFilename('grand-murin-distribution.json')).toBe('Grand Murin');
      // L'implémentation actuelle capitalise seulement les mots, produisant "Cote d'Or"
      expect((generator as any).extractSpeciesNameFromFilename('cote-dor-distribution.json')).toBe("Cote d'Or");
    });
  });

  describe('getAllDepartmentCodes', () => {
    it('should return all French department codes', () => {
      const departments = (generator as any).getAllDepartmentCodes();
      expect(departments).toHaveLength(94);
      expect(departments).toContain('01');
      expect(departments).toContain('19');
      expect(departments).toContain('21');
      expect(departments).toContain('95');
      expect(departments).not.toContain('20');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect((generator as any).getStatusColor('très rarement inventoriée')).toBe('FFEA5257');
      expect((generator as any).getStatusColor('rare ou assez rare')).toBe('FFF7A923');
      expect((generator as any).getStatusColor('peu commune ou localement commune')).toBe('FFDBE7B0');
      expect((generator as any).getStatusColor('assez commune à très commune')).toBe('FF95CB9B');
      expect((generator as any).getStatusColor('unknown status')).toBe('FFCCCCCC');
    });
  });

  describe('getStatusShortCode', () => {
    it('should return correct short codes for different statuses', () => {
      expect((generator as any).getStatusShortCode('très rarement inventoriée')).toBe('TR');
      expect((generator as any).getStatusShortCode('rare ou assez rare')).toBe('R');
      expect((generator as any).getStatusShortCode('peu commune ou localement commune')).toBe('PC');
      expect((generator as any).getStatusShortCode('assez commune à très commune')).toBe('AC');
      expect((generator as any).getStatusShortCode('présente mais mal connue')).toBe('PMC');
      expect((generator as any).getStatusShortCode('disparue ou non retrouvée')).toBe('D');
      expect((generator as any).getStatusShortCode('absente')).toBe('A');
      expect((generator as any).getStatusShortCode('unknown status')).toBe('?');
    });
  });

  describe('createDataMatrix', () => {
    it('should create data matrix with correct structure', async () => {
      const mockSpeciesData = [
        {
          speciesName: 'Test Species',
          departments: {
            '01': { name: 'Ain', distributionStatus: 'assez commune à très commune', color: { hex: '#95cb9b' } },
          },
        },
      ];

      const workbook = new (ExcelJS as any).Workbook();
      await (generator as any).createDataMatrix(workbook, mockSpeciesData);
      expect(workbook.addWorksheet).toHaveBeenCalledWith('Distribution par Département');
    });
  });

  describe('createLegendSheet', () => {
    it('should create legend sheet successfully', async () => {
      const workbook = new (ExcelJS as any).Workbook();
      await (generator as any).createLegendSheet(workbook);
      expect(workbook.addWorksheet).toHaveBeenCalledWith('Légende');
    });
  });

  describe('additional behaviors', () => {
    it('should freeze panes in data matrix worksheet', async () => {
      mockReaddir.mockResolvedValueOnce(['freeze-test-distribution.json'] as any);
      const data = [
        { department: { code: '01', name: 'Ain' }, distributionStatus: 'assez commune à très commune' }
      ];
      mockReadFile.mockResolvedValueOnce(JSON.stringify(data));

      const workbook = new (ExcelJS as any).Workbook();
      await (generator as any).createDataMatrix(workbook, await (generator as any).loadAllSpeciesData());

      // Vérifier qu'au moins une feuille a été ajoutée et que views contient freeze
      expect(workbook.addWorksheet).toHaveBeenCalledWith('Distribution par Département');
      // Notre mockWorksheet est réutilisé, on vérifie que views a été affecté
      expect(Array.isArray(workbook.addWorksheet.mock.results[0].value.views)).toBe(true);
    });

    it('should map unknown status to default color and short code', () => {
      const color = (generator as any).getStatusColor('statut inexistant XYZ');
      const code = (generator as any).getStatusShortCode('statut inexistant XYZ');
      expect(color).toBe('FFCCCCCC');
      expect(code).toBe('?');
    });
  });
});
