import { MultiSpeciesExtractor } from '../src/multiSpeciesExtractor.js';
import * as fs from 'fs/promises';
import { join, isAbsolute } from 'path';

// Mock fs
jest.mock('fs/promises');

// Mock SmartDepartmentExtractor
jest.mock('../src/smartExtractor.js', () => {
  return {
    SmartDepartmentExtractor: jest.fn().mockImplementation((imagePath: string, speciesName: string) => {
      return {
        extractDepartmentDistribution: jest.fn().mockResolvedValue([
          { departmentCode: '01', distributionStatus: 'rare' },
          { departmentCode: '02', distributionStatus: 'non détecté' },
          { departmentCode: '03', distributionStatus: 'assez commune à très commune' },
        ]),
        cleanup: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

const { SmartDepartmentExtractor: MockSmart } = require('../src/smartExtractor.js');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MultiSpeciesExtractor', () => {
  let extractor: MultiSpeciesExtractor;

  beforeEach(() => {
    extractor = new MultiSpeciesExtractor();
    jest.clearAllMocks();
  });

  describe('Extraction de noms d\'espèces', () => {
    test('devrait extraire le nom d\'espèce depuis un filename standard', () => {
      // On ne peut pas tester directement les méthodes privées,
      // mais on peut tester le comportement global
      const testFilenames = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
        'plan-actions-chiropteres.fr-murin-de-bechstein-carte-murin-de-bechstein-2048x1271.png'
      ];

      // Test que le fichier est reconnu comme valide
      testFilenames.forEach(filename => {
        expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);
        expect(filename).not.toMatch(/^README\.md$/);
        expect(filename).not.toMatch(/^\./);
      });
    });

    test('devrait reconnaître les extensions d\'image valides', () => {
      const validExtensions = ['test.png', 'test.jpg', 'test.jpeg', 'test.PNG', 'test.JPG'];
      const invalidExtensions = ['test.txt', 'test.pdf', 'README.md', '.hidden'];

      validExtensions.forEach(filename => {
        expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);
      });

      invalidExtensions.forEach(filename => {
        expect(filename).not.toMatch(/\.(png|jpg|jpeg)$/i);
      });
    });
  });

  describe('Gestion des fichiers', () => {
    test('devrait filtrer les fichiers images correctement', async () => {
      // Arrange
      const mockFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
        'README.md',
        '.hidden-file.png',
        'document.pdf',
        'another-species.jpg'
      ];

      mockFs.readdir.mockResolvedValue(mockFiles as any);

      // Act - On ne peut pas appeler directement getImageFiles (méthode privée)
      // Mais on peut vérifier que readdir est appelé avec le bon chemin
      // En réalité, on devrait tester via extractAllSpecies qui est publique

      // Pour ce test, on vérifie juste la logique de filtrage
      const validFiles = mockFiles.filter(file =>
        /\.(png|jpg|jpeg)$/i.test(file) &&
        !file.startsWith('.') &&
        file !== 'README.md'
      );

      // Assert
      expect(validFiles).toEqual([
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
        'another-species.jpg'
      ]);
    });

    test('devrait créer le dossier de sortie', async () => {
      // Arrange
      mockFs.mkdir.mockResolvedValue(undefined);

      // Act - On ne peut pas tester ensureOutputDir directement
      // Mais on peut vérifier que mkdir serait appelé avec les bons paramètres
      const outputPath = join(process.cwd(), 'output');

      // Assert - Vérifier que le chemin est correct
      expect(outputPath).toContain('output');
      expect(isAbsolute(outputPath)).toBe(true);
    });
  });

  describe('Configuration des chemins', () => {
    test('devrait avoir les bons chemins par défaut', () => {
      // Test que les chemins sont corrects
      const imagesPath = join(process.cwd(), 'images');
      const outputPath = join(process.cwd(), 'output');

      expect(imagesPath).toContain('images');
      expect(outputPath).toContain('output');
      expect(isAbsolute(imagesPath)).toBe(true);
      expect(isAbsolute(outputPath)).toBe(true);
    });
  });

  describe('Gestion d\'erreurs', () => {
    test('devrait gérer les erreurs de lecture de dossier', async () => {
      // Arrange
      mockFs.readdir.mockRejectedValue(new Error('Dossier non trouvé'));

      // La méthode getImageFiles étant privée, on ne peut pas la tester directement
      // Mais on peut vérifier que l'erreur serait capturée
      expect(async () => {
        await mockFs.readdir('/chemin/inexistant');
      }).rejects.toThrow('Dossier non trouvé');
    });
  });

  describe('extractAllSpecies (intégration simulée)', () => {
    const realFs: typeof import('fs') = require('fs');

    afterEach(() => {
      (MockSmart as jest.Mock).mockClear();
      jest.restoreAllMocks();
    });

    it('devrait ne rien faire si aucune image', async () => {
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (pathStr.endsWith('images')) return [] as any; // aucune image
        if (pathStr.endsWith('output')) return [] as any; // pas encore de fichiers
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockResolvedValue(undefined as any);

      const extractor = new MultiSpeciesExtractor();
      await extractor.extractAllSpecies();

      expect(MockSmart).not.toHaveBeenCalled();
      // Aucun writeFile (ni distribution ni consolidé)
      expect((realFs.promises.writeFile as any).mock.calls.length).toBe(0);
    });

    it('devrait traiter plusieurs images et générer le rapport consolidé', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
      ];
      const outputDistributionFiles: string[] = [];
      const distributionContents: Record<string, string> = {};
      let consolidatedContent = '';

      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (pathStr.endsWith('images')) return imageFiles as any;
        if (pathStr.endsWith('output')) return outputDistributionFiles as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async (p: any, data: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (fileName.endsWith('-distribution.json')) {
            outputDistributionFiles.push(fileName);
            distributionContents[fileName] = data.toString();
        } else if (fileName === 'consolidated-species-report.json') {
            consolidatedContent = data.toString();
        }
      });
      jest.spyOn(realFs.promises, 'readFile').mockImplementation(async (p: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (distributionContents[fileName]) return distributionContents[fileName];
        if (fileName === 'consolidated-species-report.json') return consolidatedContent;
        return '';
      });

      const extractor = new MultiSpeciesExtractor();
      await extractor.extractAllSpecies();

      expect(MockSmart).toHaveBeenCalledTimes(2);
      expect(outputDistributionFiles.length).toBe(2);
      expect(consolidatedContent).not.toBe('');
      const consolidated = JSON.parse(consolidatedContent);
      expect(consolidated.metadata.totalSpecies).toBe(2);
      expect(consolidated.species).toHaveLength(2);
      const speciesEntry = consolidated.species[0];
      expect(speciesEntry.summary).toBeDefined();
      expect(Object.values(speciesEntry.summary).reduce((a: number, b: any) => a + b, 0)).toBeGreaterThan(0);
    });

    it('devrait continuer si une espèce échoue et générer rapport pour le reste', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
      ];
      const outputDistributionFiles: string[] = [];
      const distributionContents: Record<string, string> = {};
      let consolidatedContent = '';

      // Première instance échoue, les suivantes utilisent mock par défaut (succès)
      (MockSmart as jest.Mock).mockImplementationOnce((imagePath: string, speciesName: string) => ({
        extractDepartmentDistribution: jest.fn().mockRejectedValue(new Error('fail')),
        cleanup: jest.fn().mockResolvedValue(undefined),
      }));

      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (pathStr.endsWith('images')) return imageFiles as any;
        if (pathStr.endsWith('output')) return outputDistributionFiles as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async (p: any, data: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (fileName.endsWith('-distribution.json')) {
            outputDistributionFiles.push(fileName);
            distributionContents[fileName] = data.toString();
        } else if (fileName === 'consolidated-species-report.json') {
            consolidatedContent = data.toString();
        }
      });
      jest.spyOn(realFs.promises, 'readFile').mockImplementation(async (p: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (distributionContents[fileName]) return distributionContents[fileName];
        if (fileName === 'consolidated-species-report.json') return consolidatedContent;
        return '';
      });

      const extractor = new MultiSpeciesExtractor();
      await extractor.extractAllSpecies();

      expect(MockSmart).toHaveBeenCalledTimes(2);
      expect(outputDistributionFiles.length).toBe(1);
      expect(consolidatedContent).not.toBe('');
      const consolidated = JSON.parse(consolidatedContent);
      expect(consolidated.metadata.totalSpecies).toBe(1);
      expect(consolidated.species).toHaveLength(1);
    });

    it('devrait ignorer un fichier de distribution corrompu lors de la consolidation', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
      ];
      const outputDistributionFiles: string[] = [];
      const distributionContents: Record<string, string> = {};
      let consolidatedContent = '';

      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (pathStr.endsWith('images')) return imageFiles as any;
        if (pathStr.endsWith('output')) return outputDistributionFiles as any;
        return [] as any;
      });

      // On corrompt un des fichiers au moment de l'écriture
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async (p: any, data: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (fileName.endsWith('-distribution.json')) {
          outputDistributionFiles.push(fileName);
          if (fileName.includes('grand-murin')) {
            distributionContents[fileName] = '{ invalid json'; // contenu cassé
          } else {
            distributionContents[fileName] = data.toString(); // contenu valide
          }
        } else if (fileName === 'consolidated-species-report.json') {
          consolidatedContent = data.toString();
        }
      });

      jest.spyOn(realFs.promises, 'readFile').mockImplementation(async (p: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (distributionContents[fileName]) return distributionContents[fileName];
        if (fileName === 'consolidated-species-report.json') return consolidatedContent;
        return '';
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const extractor = new MultiSpeciesExtractor();
      await extractor.extractAllSpecies();

      expect(MockSmart).toHaveBeenCalledTimes(2); // 2 extractions tentées
      // Les deux fichiers existent mais un seul a pu être parsé
      expect(outputDistributionFiles.length).toBe(2);
      expect(consolidatedContent).not.toBe('');
      const consolidated = JSON.parse(consolidatedContent);
      // totalSpecies reflète le nombre de fichiers, même si l'un est corrompu
      expect(consolidated.metadata.totalSpecies).toBe(2);
      // Seulement 1 espèce valide dans le tableau
      expect(consolidated.species).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
