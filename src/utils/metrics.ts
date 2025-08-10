export interface MetricSnapshot {
  readonly startTime: number;
  readonly endTime: number;
  readonly durationMs: number;
  readonly success: number;
  readonly failed: number;
  readonly total: number;
  readonly label: string;
}

class MetricsCollector {
  private start = Date.now();
  private success = 0;
  private failed = 0;
  private label: string;
  constructor(label: string) {
    this.label = label;
  }
  markSuccess(): void {
    this.success++;
  }
  markFailure(): void {
    this.failed++;
  }
  snapshot(): MetricSnapshot {
    const end = Date.now();
    return {
      startTime: this.start,
      endTime: end,
      durationMs: end - this.start,
      success: this.success,
      failed: this.failed,
      total: this.success + this.failed,
      label: this.label,
    };
  }
  logSummary(): void {
    const s = this.snapshot();
    const avg = s.total > 0 ? (s.durationMs / s.total).toFixed(0) : '0';
    console.log(
      `📊 ${s.label}: ${s.success} succès / ${s.failed} échec(s) en ${(s.durationMs / 1000).toFixed(2)}s (≈${avg}ms/élément)`
    );
  }
}

export function createMetrics(label: string): MetricsCollector {
  return new MetricsCollector(label);
}
