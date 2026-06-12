/**
 * In-memory sliding-window rate limiter for the public, unauthenticated
 * endpoints (demo pricing, magic links, registration). Single-process by
 * design — the app runs as one Node instance with one SQLite file.
 */

const buckets = new Map<string, number[]>();

let lastSweep = Date.now();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  // Opportunistic cleanup so abandoned keys don't accumulate forever
  if (now - lastSweep > 10 * 60 * 1000) {
    lastSweep = now;
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
