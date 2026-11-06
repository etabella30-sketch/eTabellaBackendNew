import type { Response } from 'express';

/**
 * Per-step timing of a mark save, sent back as a `Server-Timing` header (user 2026-11-03: a QFact save took 1.3 s on a
 * quiet server and 3–6 s when busy). The browser shows it in DevTools → Network → Timing and in the resource timing of
 * the request, so where a slow save spends its time can be read on any machine. Never throws.
 */
export class SaveTiming {
  private readonly started = performance.now();
  private last = this.started;
  private readonly steps: string[] = [];

  /** The step just finished (`name`: a token — letters, digits, '-'). */
  step(name: string): void {
    const now = performance.now();
    this.steps.push(`${name};dur=${(now - this.last).toFixed(1)}`);
    this.last = now;
  }

  send(res: Response | undefined): void {
    try {
      if (!res || res.headersSent) return;
      res.setHeader('Server-Timing', [...this.steps, `total;dur=${(performance.now() - this.started).toFixed(1)}`].join(', '));
    } catch { /* timing is best-effort */ }
  }
}
