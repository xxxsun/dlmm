// Simple in-memory cache with TTL — swap with Redis/Upstash in prod
type Entry = { value: any; expiresAt: number };
const store = new Map<string, Entry>();

export function cacheSet(key: string, value: any, ttlMs: number = 10000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
export function cacheGet<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { store.delete(key); return null; }
  return e.value as T;
}
export function cacheInvalidate(key: string) { store.delete(key); }

// Freshness helpers
export function freshnessLabel(ageMs: number) {
  if (ageMs < 2000) return "LIVE";
  if (ageMs < 10000) return "STALE";
  return "OFFLINE";
}
