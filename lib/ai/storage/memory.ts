import type { AIStorage } from "./types";

interface Entry {
  value: string;
  expiresAt: number | null; // null = no expiry
}

export class MemoryStorage implements AIStorage {
  private readonly store = new Map<string, Entry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const existing = await this.get(key);
    const current = existing ? parseInt(existing, 10) : 0;
    const next = current + 1;
    await this.set(key, String(next), ttlSeconds);
    return next;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /** Synchronous clear — for use in tests only. */
  clearSync(): void {
    this.store.clear();
  }
}
