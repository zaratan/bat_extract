import { resolveUserConfigFromProcess, loadUserConfig } from '../src/config/loadUserConfig.js';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { defaultConfig, mergeConfig } from '../src/config/defaultConfig.js';

// Helpers
async function withTempFile(content: string, fn: () => Promise<void>): Promise<void> {
  const path = 'batExtract.config.json';
  await writeFile(path, content, 'utf-8');
  try {
    await fn();
  } finally {
    if (existsSync(path)) await unlink(path);
  }
}

describe('loadUserConfig / resolveUserConfigFromProcess', () => {
  const originalEnvConfig = process.env.CONFIG;
  const exitSpy = jest
    .spyOn(process, 'exit')
    .mockImplementation((() => { throw new Error('process.exit called'); }) as any);

  afterAll(() => {
    exitSpy.mockRestore();
    if (originalEnvConfig !== undefined) {
      process.env.CONFIG = originalEnvConfig;
    } else {
      delete process.env.CONFIG;
    }
  });

  afterEach(() => {
    // clear env variable
    if (originalEnvConfig !== undefined) {
      process.env.CONFIG = originalEnvConfig;
    } else {
      delete process.env.CONFIG;
    }
    exitSpy.mockClear();
  });

  describe('loadUserConfig', () => {
    it('returns undefined when file missing', async () => {
      const cfg = await loadUserConfig('file_does_not_exist.json');
      expect(cfg).toBeUndefined();
    });

    it('loads and parses JSON file', async () => {
      await withTempFile('{"network":{"requestDelayMs":123}}', async () => {
        const cfg = await loadUserConfig();
        expect(cfg).toEqual({ network: { requestDelayMs: 123 } });
      });
    });

    it('returns undefined on invalid JSON file', async () => {
      await withTempFile('{invalid', async () => {
        const cfg = await loadUserConfig();
        expect(cfg).toBeUndefined();
      });
    });
  });

  describe('resolveUserConfigFromProcess precedence', () => {
    it('uses --config argument first', async () => {
      process.env.CONFIG = '{"network":{"requestDelayMs":10}}';
      await withTempFile('{"network":{"requestDelayMs":999}}', async () => {
        const cfg = await resolveUserConfigFromProcess([
          '--config',
          '{"network":{"requestDelayMs":777}}',
        ]);
        expect(cfg).toEqual({ network: { requestDelayMs: 777 } });
      });
    });

    it('falls back to env CONFIG when no --config', async () => {
      process.env.CONFIG = '{"network":{"requestDelayMs":55}}';
      const cfg = await resolveUserConfigFromProcess([]);
      expect(cfg).toEqual({ network: { requestDelayMs: 55 } });
    });

    it('falls back to file when no --config and no env', async () => {
      delete process.env.CONFIG;
      await withTempFile('{"network":{"requestDelayMs":888}}', async () => {
        const cfg = await resolveUserConfigFromProcess([]);
        expect(cfg).toEqual({ network: { requestDelayMs: 888 } });
      });
    });

    it('returns undefined if nothing provided', async () => {
      delete process.env.CONFIG;
      const cfg = await resolveUserConfigFromProcess([]);
      expect(cfg).toBeUndefined();
    });

    it('exits (process.exit) on invalid JSON in --config', async () => {
      delete process.env.CONFIG;
      await expect(
        resolveUserConfigFromProcess(['--config', '{invalid'])
      ).rejects.toThrow('process.exit called');
      expect(exitSpy).toHaveBeenCalled();
    });

    it('exits (process.exit) on invalid JSON in env CONFIG', async () => {
      process.env.CONFIG = '{invalid';
      await expect(resolveUserConfigFromProcess([])).rejects.toThrow(
        'process.exit called'
      );
      expect(exitSpy).toHaveBeenCalled();
    });
  });

  describe('integration with mergeConfig', () => {
    it('properly merges user overrides', async () => {
      const user = { network: { requestDelayMs: 42 } };
      const baseline = mergeConfig();
      const merged = mergeConfig(user);
      expect(merged.network.requestDelayMs).toBe(42);
      // Le chemin des images ne doit pas changer en dehors de l override user; on compare au baseline (qui inclut potentiels overrides test)
      expect(merged.paths.imagesDir).toBe(baseline.paths.imagesDir);
      // Et defaultConfig reste la source "brute"
      expect(defaultConfig.paths.imagesDir).toBe('images');
    });
  });
});
