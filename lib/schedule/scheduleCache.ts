import type { ScheduleSectionsState } from './types';

const cache = new Map<string, ScheduleSectionsState>();
let cacheVersion = 0;

export function getCacheVersion(): number {
  return cacheVersion;
}

export function incrementCacheVersion(): void {
  cacheVersion++;
}

export function getCachedSchedules(petId: string): ScheduleSectionsState | undefined {
  return cache.get(petId);
}

export function setCachedSchedules(petId: string, state: ScheduleSectionsState): void {
  cache.set(petId, state);
  incrementCacheVersion();
}

export function clearCachedSchedules(petId?: string): void {
  incrementCacheVersion();
  if (petId) {
    cache.delete(petId);
    return;
  }
  cache.clear();
}
