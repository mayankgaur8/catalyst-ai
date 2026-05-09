export type { AIStorage } from "./types";
export { MemoryStorage } from "./memory";
export { RedisStorage } from "./redis";

import type { AIStorage } from "./types";
import { MemoryStorage } from "./memory";
import { RedisStorage } from "./redis";

function createStorage(): AIStorage {
  if (process.env.REDIS_URL) {
    return new RedisStorage();
  }
  return new MemoryStorage();
}

/** Shared storage singleton — all AI modules use this instance. */
export const storage: AIStorage = createStorage();
