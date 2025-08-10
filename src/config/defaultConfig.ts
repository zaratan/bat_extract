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
  readonly priorityDetection: {
    readonly headingClassNames: readonly string[];
    readonly enableInlineStyleFallback: boolean;
    readonly fallbackInlineStyleColors: readonly string[];
    readonly fallbackStyleColorKeyword: string | null;
    /** Taille de la fenêtre de recherche (chars) avant le lien */
    readonly searchWindowChars: number;
  };
  readonly sources: {
    readonly baseUrl: string;
    readonly speciesListPath: string; // chemin relatif pour la page liste
    readonly speciesPathSegment: string; // segment utilisé dans les href
  };
  readonly images: {
    readonly resolutionSuffix: string; // ex: -2048x1271
    readonly fileNamePattern: string; // pattern avec placeholders {slug}
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
  parallel: { maxConcurrentDownloads: 3, maxConcurrentExtractions: 4 },
  excel: {
    sheetNameMatrix: 'Distribution',
    sheetNameLegend: 'Légende',
    autosizeColumns: true,
  },
  workflow: { failFast: false, continueOnPartialErrors: true, verbose: false },
  priorityDetection: {
    headingClassNames: ['has-orange-background-color'],
    enableInlineStyleFallback: true,
    fallbackInlineStyleColors: ['#f7a923'],
    fallbackStyleColorKeyword: 'orange',
    searchWindowChars: 600,
  },
  sources: {
    baseUrl: 'https://plan-actions-chiropteres.fr',
    speciesListPath: '/les-chauves-souris/les-especes/',
    speciesPathSegment: '/les-chauves-souris/les-especes/',
  },
  images: {
    resolutionSuffix: '-2048x1271',
    fileNamePattern:
      'plan-actions-chiropteres.fr-{slug}-carte-{slug}{resolution}.png',
  },
} satisfies DefaultConfig);

export function mergeConfig(
  partial?: DeepPartial<DefaultConfig>
): DefaultConfig {
  if (!partial) {
    const base = applyTestPathOverrides(defaultConfig);
    return base;
  }
  // shallow clone via JSON since object is simple (only primitives / plain objects)
  const clone: DefaultConfig = JSON.parse(JSON.stringify(defaultConfig));
  applyMerge(
    clone as unknown as Record<string, unknown>,
    partial as Record<string, unknown>,
    'root'
  );
  return Object.freeze(applyTestPathOverrides(clone));
}

function applyTestPathOverrides(cfg: DefaultConfig): DefaultConfig {
  if (
    process.env.BATEXTRACT_TEST_OUTPUT_DIR ||
    process.env.BATEXTRACT_TEST_IMAGES_DIR
  ) {
    const clone: DefaultConfig = JSON.parse(JSON.stringify(cfg));
    const paths = (
      clone as unknown as {
        paths: { imagesDir: string; outputDir: string; tempDir: string };
      }
    ).paths;
    if (process.env.BATEXTRACT_TEST_OUTPUT_DIR) {
      paths.outputDir = process.env.BATEXTRACT_TEST_OUTPUT_DIR;
    }
    if (process.env.BATEXTRACT_TEST_IMAGES_DIR) {
      paths.imagesDir = process.env.BATEXTRACT_TEST_IMAGES_DIR;
    }
    return Object.freeze(clone);
  }
  return cfg;
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
