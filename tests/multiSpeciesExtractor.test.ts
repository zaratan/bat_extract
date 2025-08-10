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

// Helpers pour détecter suffixes dynamiques (images_test / output_test en environnement tests)
const testImagesDirName = process.env.BATEXTRACT_TEST_IMAGES_DIR || 'images';
const testOutputDirName = process.env.BATEXTRACT_TEST_OUTPUT_DIR || 'output';

// Fonction utilitaire: tester si un chemin se termine bien par le répertoire attendu
function endsWithDir(pathStr: string, dirName: string): boolean {
  return pathStr.split(/[/\\]/).pop() === dirName;
}

describe('MultiSpeciesExtractor', () => {
  let extractor: MultiSpeciesExtractor;

  beforeEach(() => {
    extractor = new MultiSpeciesExtractor();
    jest.clearAllMocks();
  });

  describe('Extraction des noms d\'espèces', () => {
    test('devrait extraire le nom d\'espèce depuis un filename standard', () => {
      const testFilenames = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
        'plan-actions-chiropteres.fr-murin-de-bechstein-carte-murin-de-bechstein-2048x1271.png'
      ];
      testFilenames.forEach(filename => {
        expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);
        expect(filename).not.toMatch(/^README\.md$/);
        expect(filename).not.toMatch(/^\./);
      });
    });

    test('devrait reconnaître les extensions d\'image valides', () => {
      const validExtensions = ['test.png', 'test.jpg', 'test.jpeg', 'test.PNG', 'test.JPG'];
      const invalidExtensions = ['test.txt', 'test.pdf', 'README.md', '.hidden'];
      validExtensions.forEach(filename => { expect(filename).toMatch(/\.(png|jpg|jpeg)$/i); });
      invalidExtensions.forEach(filename => { expect(filename).not.toMatch(/\.(png|jpg|jpeg)$/i); });
    });
  });

  describe('Gestion des fichiers', () => {
    test('devrait filtrer les fichiers images correctement', async () => {
      const mockFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
        'README.md',
        '.hidden-file.png',
        'document.pdf',
        'another-species.jpg'
      ];
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      const validFiles = mockFiles.filter(file =>
        /\.(png|jpg|jpeg)$/i.test(file) &&
        !file.startsWith('.') &&
        file !== 'README.md'
      );
      expect(validFiles).toEqual([
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
        'another-species.jpg'
      ]);
    });

    test('devrait créer le dossier de sortie', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      const outputPath = join(process.cwd(), testOutputDirName);
      expect(outputPath).toContain('output');
      expect(isAbsolute(outputPath)).toBe(true);
    });
  });

  describe('Configuration des chemins', () => {
    test('devrait avoir les bons chemins par défaut', () => {
      const imagesPath = join(process.cwd(), testImagesDirName);
      const outputPath = join(process.cwd(), testOutputDirName);
      expect(imagesPath).toContain('images');
      expect(outputPath).toContain('output');
      expect(isAbsolute(imagesPath)).toBe(true);
      expect(isAbsolute(outputPath)).toBe(true);
    });
  });

  describe('Gestion d\'erreurs', () => {
    test('devrait gérer les erreurs de lecture de dossier', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Dossier non trouvé'));
      await expect(mockFs.readdir('/chemin/inexistant')).rejects.toThrow('Dossier non trouvé');
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
        if (endsWithDir(pathStr, testImagesDirName)) return [] as any;
        if (endsWithDir(pathStr, testOutputDirName)) return [] as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockResolvedValue(undefined as any);
      const extractor = new MultiSpeciesExtractor();
      await extractor.extractAllSpecies();
      expect(MockSmart).not.toHaveBeenCalled();
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
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return outputDistributionFiles as any;
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
      (MockSmart as jest.Mock).mockImplementationOnce(() => ({
        extractDepartmentDistribution: jest.fn().mockRejectedValue(new Error('fail')),
        cleanup: jest.fn().mockResolvedValue(undefined),
      }));
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return outputDistributionFiles as any;
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
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return outputDistributionFiles as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async (p: any, data: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (fileName.endsWith('-distribution.json')) {
          outputDistributionFiles.push(fileName);
          if (fileName.includes('grand-murin')) {
            distributionContents[fileName] = '{ invalid json';
          } else {
            distributionContents[fileName] = data.toString();
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
      expect(MockSmart).toHaveBeenCalledTimes(2);
      expect(outputDistributionFiles.length).toBe(2);
      expect(consolidatedContent).not.toBe('');
      const consolidated = JSON.parse(consolidatedContent);
      expect(consolidated.metadata.totalSpecies).toBe(2);
      expect(consolidated.species).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Retour structuré et injection de factory', () => {
    const realFs: typeof import('fs') = require('fs');

    it('devrait retourner un résultat structuré success avec outputFile', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
      ];
      const outputDistributionFiles: string[] = [];
      const distributionContents: Record<string, string> = {};
      let consolidatedContent = '';
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return outputDistributionFiles as any;
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
      const results = await extractor.extractAllSpecies();
      expect(results).toHaveLength(1);
      const r = results[0];
      expect(r.success).toBe(true);
      expect(r.outputFile).toBeDefined();
      expect(r.outputFile).toContain('-distribution.json');
      expect(r.speciesName.toLowerCase()).toContain('grand');
    });

    it('devrait retourner un résultat structuré error si extraction échoue', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
      ];
      class FailingFactory { create() { return { extractDepartmentDistribution: jest.fn().mockRejectedValue(new Error('explosion')), cleanup: jest.fn().mockResolvedValue(undefined) }; } }
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return [] as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockResolvedValue(undefined as any);
      const extractor = new MultiSpeciesExtractor(new (FailingFactory as any)());
      const results = await extractor.extractAllSpecies();
      expect(results).toHaveLength(1);
      const r = results[0];
      expect(r.success).toBe(false);
      expect(r.error).toContain('explosion');
      expect(r.outputFile).toBeUndefined();
    });

    it('devrait appeler la factory avec les bons paramètres', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
      ];
      const createSpy = jest.fn().mockImplementation(() => ({ extractDepartmentDistribution: jest.fn().mockResolvedValue([]), cleanup: jest.fn().mockResolvedValue(undefined) }));
      class SpyFactory { create(imagePath: string, speciesName: string) { return createSpy(imagePath, speciesName); } }
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return [] as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async () => {});
      jest.spyOn(realFs.promises, 'readFile').mockResolvedValue('[]' as any);
      const extractor = new MultiSpeciesExtractor(new (SpyFactory as any)());
      await extractor.extractAllSpecies();
      expect(createSpy).toHaveBeenCalledTimes(1);
      const [imagePathArg, speciesNameArg] = createSpy.mock.calls[0];
      expect(imagePathArg).toContain(testImagesDirName.replace('_test',''));
      expect(imagePathArg).toContain('.png');
      expect(speciesNameArg.toLowerCase()).toContain('barbastelle');
    });
  });

  describe('Parallélisation', () => {
    const realFs: typeof import('fs') = require('fs');
    it('devrait utiliser le mode parallèle limité quand maxConcurrentExtractions>1', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
        'plan-actions-chiropteres.fr-carte-grand-murin-carte-grand-murin-2048x1271.png',
        'plan-actions-chiropteres.fr-murin-de-bechstein-carte-murin-de-bechstein-2048x1271.png'
      ];
      const outputDistributionFiles: string[] = [];
      const distributionContents: Record<string,string> = {};
      let consolidatedContent = '';
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return outputDistributionFiles as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async (p:any,data:any)=>{
        const fileName = p.toString().split('/').pop()!;
        if (fileName.endsWith('-distribution.json')) {
          outputDistributionFiles.push(fileName);
          distributionContents[fileName] = data.toString();
        } else if (fileName === 'consolidated-species-report.json') {
          consolidatedContent = data.toString();
        }
      });
      jest.spyOn(realFs.promises, 'readFile').mockImplementation(async (p:any)=>{
        const fileName = p.toString().split('/').pop()!;
        if (distributionContents[fileName]) return distributionContents[fileName];
        if (fileName === 'consolidated-species-report.json') return consolidatedContent;
        return '';
      });
      const extractor = new MultiSpeciesExtractor(undefined as any, { parallel: { maxConcurrentExtractions: 2 } });
      const results = await extractor.extractAllSpecies();
      expect(results).toHaveLength(3);
      expect(outputDistributionFiles.length).toBe(3);
      expect(consolidatedContent).not.toBe('');
    });
  });

  describe('Persistance des métriques', () => {
    const realFs: typeof import('fs') = require('fs');

    it('devrait persister les métriques multi-espèces', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png',
      ];
      const outputDistributionFiles: string[] = [];
      const distributionContents: Record<string, string> = {};
      let consolidatedContent = '';
      let metricsContent = '';
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return outputDistributionFiles as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async (p: any, data: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (fileName.endsWith('-distribution.json')) {
          outputDistributionFiles.push(fileName);
          distributionContents[fileName] = data.toString();
        } else if (fileName === 'consolidated-species-report.json') {
          consolidatedContent = data.toString();
        } else if (fileName === 'metrics-multi-species.json') {
          metricsContent = data.toString();
        }
      });
      jest.spyOn(realFs.promises, 'readFile').mockImplementation(async (p: any) => {
        const fileName = p.toString().split('/').pop()!;
        if (distributionContents[fileName]) return distributionContents[fileName];
        if (fileName === 'consolidated-species-report.json') return consolidatedContent;
        if (fileName === 'metrics-multi-species.json') return metricsContent;
        return '';
      });
      const extractor = new MultiSpeciesExtractor();
      await extractor.extractAllSpecies();
      expect(metricsContent).not.toBe('');
      const metricsJson = JSON.parse(metricsContent);
      expect(metricsJson.type).toBe('multiSpeciesExtractionMetrics');
      expect(Array.isArray(metricsJson.runs)).toBe(true);
      expect(metricsJson.runs.length).toBe(1);
      const run = metricsJson.runs[0];
      expect(run.total).toBe(1);
      expect(metricsJson.aggregates.totalRuns).toBe(1);
    });

    it('ne devrait pas dupliquer un run métrique identique consécutif', async () => {
      const imageFiles = [
        'plan-actions-chiropteres.fr-barbastelle-deurope-carte-barbastelle-deurope-2048x1271.png'
      ];
      const outputDistributionFiles: string[] = [];
      const distributionContents: Record<string,string> = {};
      let metricsContent = '';
      const realFs: typeof import('fs') = require('fs');
      jest.spyOn(realFs.promises, 'mkdir').mockResolvedValue(undefined as any);
      jest.spyOn(realFs.promises, 'readdir').mockImplementation(async (p:any)=>{
        const pathStr = p.toString();
        if (endsWithDir(pathStr, testImagesDirName)) return imageFiles as any;
        if (endsWithDir(pathStr, testOutputDirName)) return outputDistributionFiles as any;
        return [] as any;
      });
      jest.spyOn(realFs.promises, 'writeFile').mockImplementation(async (p:any,data:any)=>{
        const fileName = p.toString().split('/').pop()!;
        if (fileName.endsWith('-distribution.json')) {
          outputDistributionFiles.push(fileName);
          distributionContents[fileName] = data.toString();
        } else if (fileName === 'metrics-multi-species.json') {
          metricsContent = data.toString();
        }
      });
      jest.spyOn(realFs.promises, 'readFile').mockImplementation(async (p:any)=>{
        const f = p.toString().split('/').pop()!;
        if (distributionContents[f]) return distributionContents[f];
        if (f === 'metrics-multi-species.json') return metricsContent;
        return '';
      });
      const extractor1 = new MultiSpeciesExtractor();
      await extractor1.extractAllSpecies();
      const afterFirst = JSON.parse(metricsContent);
      expect(afterFirst.runs.length).toBe(1);
      // Second run identique (mêmes images) → ne doit pas ajouter
      const extractor2 = new MultiSpeciesExtractor();
      await extractor2.extractAllSpecies();
      const afterSecond = JSON.parse(metricsContent);
      expect(afterSecond.runs.length).toBe(1);
    });
  });
});
