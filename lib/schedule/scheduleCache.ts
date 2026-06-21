import type { ScheduleSectionsState } from './types';

const cache = new Map<string, ScheduleSectionsState>();

export function getCachedSchedules(petId: string): ScheduleSectionsState | undefined {
  return cache.get(petId);
}

export function setCachedSchedules(petId: string, state: ScheduleSectionsState): void {
  cache.set(petId, state);
}

export function clearCachedSchedules(petId?: string): void {
  if (petId) {
    cache.delete(petId);
    return;
  }
  cache.clear();
}
