import { SmartDepartmentExtractor } from '../src/smartExtractor.js';
import { mergeConfig } from '../src/config/defaultConfig.js';

// Mock sharp pour retourner des données brutes cohérentes avec l'implémentation (resolveWithObject)
jest.mock('sharp', () => {
  return () => ({
    raw: () => ({
      toBuffer: async (opts?: any) => {
        const width = 10;
        const height = 10;
        const data = Buffer.alloc(width * height * 3, 0); // pixels noirs ignorés → pas de couleur dominante
        if (opts && opts.resolveWithObject) {
          return { data, info: { width, height } };
        }
        return data;
      },
    }),
  });
});

describe('SmartDepartmentExtractor config utilisation', () => {
  it('accepte maxDepartmentRetries dans la config sans erreur', async () => {
    const cfg = mergeConfig({ extraction: { maxDepartmentRetries: 1 } });
    const extractor = new SmartDepartmentExtractor('dummy.png', 'Test', { config: cfg } as any);
    const result: any = await (extractor as any).extractDepartmentDistribution();
    expect(Array.isArray(result)).toBe(true);
  });
});
