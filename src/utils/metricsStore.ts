import { promises as fs } from 'fs';
import { join } from 'path';
import type { MetricSnapshot } from './metrics.js';

/** Structure d'un run individuel (persisté) */
export interface MultiSpeciesExtractionRun extends MetricSnapshot {
  readonly timestamp: string; // ISO string de fin de run
  readonly successRate: number; // 0..100 arrondi
  readonly extra?: Record<string, unknown>; // champs additionnels (optionnel)
}

/** Structure du fichier persistant */
export interface MultiSpeciesExtractionMetricsFile {
  readonly type: 'multiSpeciesExtractionMetrics';
  readonly runs: MultiSpeciesExtractionRun[];
  readonly aggregates: {
    readonly totalRuns: number;
    readonly totalSpeciesProcessed: number; // somme des totals
    readonly overallSuccessRate: number; // (somme successes / somme totals)*100 arrondi
    readonly lastRunAt: string | null; // ISO dernier run
  };
}

const FILE_NAME = 'metrics-multi-species.json';

/**
 * Charge le fichier de métriques s'il existe, sinon retourne une structure vide.
 */
async function loadMetricsFile(
  outputDir: string
): Promise<MultiSpeciesExtractionMetricsFile> {
  const filePath = join(outputDir, FILE_NAME);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(
      raw
    ) as Partial<MultiSpeciesExtractionMetricsFile>;
    if (parsed && Array.isArray(parsed.runs)) {
      return parsed as MultiSpeciesExtractionMetricsFile;
    }
  } catch {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('📊 Metrics: fichier inexistant ou illisible, recréation.');
    }
  }
  return {
    type: 'multiSpeciesExtractionMetrics',
    runs: [],
    aggregates: {
      totalRuns: 0,
      totalSpeciesProcessed: 0,
      overallSuccessRate: 0,
      lastRunAt: null,
    },
  };
}

function computeAggregates(
  runs: MultiSpeciesExtractionRun[]
): MultiSpeciesExtractionMetricsFile['aggregates'] {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      totalSpeciesProcessed: 0,
      overallSuccessRate: 0,
      lastRunAt: null,
    };
  }
  const totalSpeciesProcessed = runs.reduce((acc, r) => acc + r.total, 0);
  const totalSuccess = runs.reduce((acc, r) => acc + r.success, 0);
  const overallSuccessRate =
    totalSpeciesProcessed > 0
      ? Math.round((totalSuccess / totalSpeciesProcessed) * 100)
      : 0;
  const lastRunAt = runs[runs.length - 1].timestamp;
  return {
    totalRuns: runs.length,
    totalSpeciesProcessed,
    overallSuccessRate,
    lastRunAt,
  };
}

/**
 * Ajoute un snapshot d'extraction multi-espèces au fichier de métriques.
 * Idempotent pour le run courant (chaque appel ajoute une entrée). Utiliser avec discernement.
 * @returns chemin absolu du fichier de métriques.
 */
export async function appendMultiSpeciesExtractionMetrics(
  snapshot: MetricSnapshot,
  options: { outputDir: string; extra?: Record<string, unknown> }
): Promise<string> {
  const { outputDir, extra } = options;
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = join(outputDir, FILE_NAME);
  const existing = await loadMetricsFile(outputDir);

  const run: MultiSpeciesExtractionRun = {
    ...snapshot,
    timestamp: new Date(snapshot.endTime).toISOString(),
    successRate:
      snapshot.total > 0
        ? Math.round((snapshot.success / snapshot.total) * 100)
        : 0,
    extra,
  };

  const last = existing.runs[existing.runs.length - 1];
  if (last) {
    const sameCore =
      last.success === run.success &&
      last.failed === run.failed &&
      last.total === run.total &&
      last.label === run.label &&
      last.successRate === run.successRate &&
      JSON.stringify(last.extra || {}) === JSON.stringify(run.extra || {});
    if (sameCore) {
      // Aucune variation → ne pas dupliquer; retourner chemin existant.
      return filePath;
    }
  }

  const runs = [...existing.runs, run];
  const aggregates = computeAggregates(runs);
  const fileData: MultiSpeciesExtractionMetricsFile = {
    type: 'multiSpeciesExtractionMetrics',
    runs,
    aggregates,
  };

  await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
  return filePath;
}

/**
 * Lit (sans modifier) les métriques persistées.
 */
export async function readMultiSpeciesExtractionMetrics(
  outputDir: string
): Promise<MultiSpeciesExtractionMetricsFile> {
  return loadMetricsFile(outputDir);
}
