// Central configuration module for BatExtract
// Provides defaultConfig (frozen), types, and mergeConfig utility with strict key checking.
// ESM: all internal relative imports must include .js (none needed here for now)

export interface DefaultConfig {
  readonly paths: {
    readonly imagesDir: string;
    readonly outputDir: string;
    readonly tempDir: string;
  };
  readonly extraction: {
    readonly sampleRadius: number;
    readonly minPixelThreshold: number;
    readonly maxDepartmentRetries: number;
  };
  readonly network: {
    readonly requestDelayMs: number;
    readonly timeoutMs: number;
    readonly retryCount: number;
  };
  readonly parallel: {
    readonly maxConcurrentDownloads: number;
    readonly maxConcurrentExtractions: number;
  };
  readonly excel: {
    readonly sheetNameMatrix: string;
    readonly sheetNameLegend: string;
    readonly autosizeColumns: boolean;
  };
  readonly workflow: {
    readonly failFast: boolean;
    readonly continueOnPartialErrors: boolean;
    readonly verbose: boolean;
  };
}

// DeepPartial type (utility) – minimal implementation (no need for external lib)
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? T[K] extends Array<unknown>
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

export const defaultConfig: DefaultConfig = Object.freeze({
  paths: { imagesDir: 'images', outputDir: 'output', tempDir: '.tmp' },
  extraction: {
    sampleRadius: 30,
    minPixelThreshold: 10, // ajusté de 15 -> 10 pour cohérence avec implémentation actuelle
    maxDepartmentRetries: 0,
  },
  network: { requestDelayMs: 1000, timeoutMs: 15000, retryCount: 2 },
  parallel: { maxConcurrentDownloads: 3, maxConcurrentExtractions: 2 },
  excel: {
    sheetNameMatrix: 'Distribution',
    sheetNameLegend: 'Légende',
    autosizeColumns: true,
  },
  workflow: { failFast: false, continueOnPartialErrors: true, verbose: false },
} satisfies DefaultConfig);

export function mergeConfig(
  partial?: DeepPartial<DefaultConfig>
): DefaultConfig {
  if (!partial) return defaultConfig;
  // shallow clone via JSON since object is simple (only primitives / plain objects)
  const clone: DefaultConfig = JSON.parse(JSON.stringify(defaultConfig));
  applyMerge(
    clone as unknown as Record<string, unknown>,
    partial as Record<string, unknown>,
    'root'
  );
  return Object.freeze(clone);
}

function applyMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  ctx: string
): void {
  if (source == null) return;
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      throw new Error(`Configuration key inconnue: ${ctx}.${key}`);
    }
    const srcVal = source[key];
    const tgtVal = target[key];
    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      applyMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
        `${ctx}.${key}`
      );
    } else {
      (target as Record<string, unknown>)[key] = srcVal;
    }
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Optional validation placeholder (extend later if needed)
export function validateConfig(cfg: DefaultConfig): void {
  if (cfg.extraction.sampleRadius <= 0) {
    throw new Error('sampleRadius doit être > 0');
  }
  if (cfg.extraction.minPixelThreshold < 0) {
    throw new Error('minPixelThreshold doit être >= 0');
  }
}

export type { DefaultConfig as BatExtractConfig };
