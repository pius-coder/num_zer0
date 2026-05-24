import type { ExecutionEvent } from "./event-bus";

export interface FunctionMetrics {
  invocations1m: number;
  errors1m: number;
  avgLatency1m: number;
  p50Latency1m: number;
  p90Latency1m: number;
  p99Latency1m: number;
  lastCalled: Date | null;
}

const WINDOW_MS = 60_000;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const k = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, k)];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

class MetricsStore {
  private events: ExecutionEvent[] = [];

  record(event: ExecutionEvent): void {
    this.events.push(event);
    this.cleanup();
  }

  getAll(): FunctionMetrics {
    return this.compute(this.events);
  }

  getForFunction(name: string): FunctionMetrics {
    return this.compute(this.events.filter((e) => e.name === name));
  }

  listFunctionNames(): string[] {
    const names = new Set<string>();
    const now = Date.now();
    for (const e of this.events) {
      if (now - e.timestamp.getTime() < WINDOW_MS) names.add(e.name);
    }
    return [...names].sort();
  }

  private compute(events: ExecutionEvent[]): FunctionMetrics {
    const now = Date.now();
    const window = events.filter(
      (e) => now - e.timestamp.getTime() < WINDOW_MS,
    );
    const latencies = window.map((e) => e.durationMs).sort((a, b) => a - b);
    const errors = window.filter((e) => e.status === "error");
    return {
      invocations1m: window.length,
      errors1m: errors.length,
      avgLatency1m: average(latencies),
      p50Latency1m: percentile(latencies, 50),
      p90Latency1m: percentile(latencies, 90),
      p99Latency1m: percentile(latencies, 99),
      lastCalled:
        window.length > 0 ? window[window.length - 1].timestamp : null,
    };
  }

  private cleanup(): void {
    const cutoff = Date.now() - WINDOW_MS;
    this.events = this.events.filter(
      (e) => e.timestamp.getTime() > cutoff,
    );
  }
}

export const metricsStore = new MetricsStore();
