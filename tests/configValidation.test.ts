import { mergeConfig, defaultConfig, validateConfig } from '../src/config/defaultConfig.js';

describe('config merge & validation', () => {
  it('merges nested objects and overrides only provided keys', () => {
    const merged = mergeConfig({ network: { requestDelayMs: 250 } });
    expect(merged.network.requestDelayMs).toBe(250);
    // untouched key
    expect(merged.network.timeoutMs).toBe(defaultConfig.network.timeoutMs);
  });

  it('throws on unknown top-level key', () => {
    expect(() =>
      mergeConfig({ unknownKey: 1 } as any)
    ).toThrow(/Configuration key inconnue: root.unknownKey/);
  });

  it('throws on unknown nested key', () => {
    expect(() =>
      mergeConfig({ network: { bad: 1 } as any })
    ).toThrow(/Configuration key inconnue: root.network.bad/);
  });

  it('produces frozen object (immutable)', () => {
    const merged = mergeConfig();
    expect(Object.isFrozen(merged)).toBe(true);
  });

  it('validateConfig passes for defaultConfig', () => {
    expect(() => validateConfig(defaultConfig)).not.toThrow();
  });

  it('validateConfig fails for invalid sampleRadius', () => {
    const bad = mergeConfig({ extraction: { sampleRadius: 0 } });
    expect(() => validateConfig(bad)).toThrow(/sampleRadius/);
  });

  it('validateConfig fails for negative minPixelThreshold', () => {
    const bad = mergeConfig({ extraction: { minPixelThreshold: -1 } });
    expect(() => validateConfig(bad)).toThrow(/minPixelThreshold/);
  });
});
