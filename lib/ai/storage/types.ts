// ── Async storage interface ───────────────────────────────────────────────────
// Implementations: MemoryStorage (dev/single-instance) and RedisStorage (prod/multi-instance)

export interface AIStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Atomically increment an integer counter. Returns value AFTER increment. */
  increment(key: string, ttlSeconds?: number): Promise<number>;
  delete(key: string): Promise<void>;
}
