import { BatExtractWorkflow } from '../src/runCompleteWorkflow.js';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as os from 'os';
import * as childProcess from 'child_process';

jest.mock('child_process', () => ({ execSync: jest.fn(() => '') }));
jest.mock('fs/promises', () => ({ access: jest.fn(), readFile: jest.fn(), writeFile: jest.fn() }));

// Répertoire temporaire racine pour isoler les tests
let tempRoot: string;
function setupFilesystem(options: { corruptConsolidated?: boolean } = {}) {
  tempRoot = mkdtempSync(join(os.tmpdir(), 'batwf-'));
  const imagesDir = join(tempRoot, 'images');
  const outputDir = join(tempRoot, 'output');
  fs.mkdirSync(imagesDir);
  fs.mkdirSync(outputDir);
  // créer fichiers attendus
  fs.writeFileSync(join(imagesDir, 'a.png'), '');
  fs.writeFileSync(join(imagesDir, 'b.png'), '');
  fs.writeFileSync(join(outputDir, 'species-a-distribution.json'), '[]');
  fs.writeFileSync(join(outputDir, 'species-b-distribution.json'), '[]');
  fs.writeFileSync(join(outputDir, 'generated-species-data.json'), JSON.stringify({ metadata: { totalSpecies: 2, prioritySpecies: 1 } }));
  fs.writeFileSync(join(outputDir, 'discovered-image-urls.json'), JSON.stringify({ metadata: { totalSpecies: 2, imagesFound: 2, errors: 0 } }));
  fs.writeFileSync(join(outputDir, 'bat-distribution-matrix.xlsx'), 'xlsx');
  if (!options.corruptConsolidated) {
    fs.writeFileSync(join(outputDir, 'consolidated-species-report.json'), JSON.stringify({ summary: { A: { detectedDepartments: 10 }, B: { detectedDepartments: 20 } } }));
  } else {
    fs.writeFileSync(join(outputDir, 'consolidated-species-report.json'), '{bad json');
  }
  // Mocks access/readFile pour pointer vers ces fichiers
  (fsPromises.access as jest.Mock).mockImplementation(async (p: any) => {
    if (!fs.existsSync(p)) throw new Error('not found');
  });
  (fsPromises.readFile as jest.Mock).mockImplementation(async (p: any) => {
    return fs.readFileSync(p, 'utf-8');
  });
}

describe('BatExtractWorkflow', () => {
  let execSpy: jest.Mock;

  beforeEach(() => {
    execSpy = (childProcess as any).execSync as jest.Mock;
    execSpy.mockReset();
  });

  it('devrait exécuter le workflow complet avec succès', async () => {
    setupFilesystem();
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempRoot);
    const workflow = new BatExtractWorkflow();
    await workflow.runCompleteWorkflow();
    expect(execSpy).toHaveBeenCalledTimes(5);
    const report = (workflow as any).report;
    expect(report.overallStatus).toBe('success');
    cwdSpy.mockRestore();
  });

  it('devrait marquer le workflow en partiel si une étape échoue', async () => {
    setupFilesystem();
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempRoot);
    let call = 0;
    execSpy.mockImplementation(() => {
      call++;
      if (call === 2) throw new Error('fail step');
      return '';
    });
    const workflow = new BatExtractWorkflow();
    await workflow.runCompleteWorkflow();
    const report = (workflow as any).report;
    expect(report.overallStatus).toBe('partial');
    expect(report.steps.some((s: any) => s.status === 'error')).toBe(true);
    cwdSpy.mockRestore();
  });

  it("devrait gérer un rapport consolidé illisible sans casser l'étape extraction", async () => {
    setupFilesystem({ corruptConsolidated: true });
    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempRoot);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const workflow = new BatExtractWorkflow();
    await workflow.runCompleteWorkflow();
    const report = (workflow as any).report;
    const extractionStep = report.steps.find((s: any) => s.name.includes('Extraction'));
    expect(extractionStep.status).toBe('success');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    cwdSpy.mockRestore();
  });
});
