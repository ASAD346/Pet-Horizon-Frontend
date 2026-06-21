import type { ApiPet } from '@/types/pet';

let cachedScope = '';
let cachedPet: ApiPet | null = null;
let hasLoaded = false;

export function getActivePetCache(scopeKey: string | null | undefined): ApiPet | null {
  if (!scopeKey || scopeKey !== cachedScope) return null;
  return cachedPet;
}

export function setActivePetCache(scopeKey: string, pet: ApiPet | null) {
  cachedScope = scopeKey;
  cachedPet = pet;
  hasLoaded = true;
}

export function clearActivePetCache() {
  cachedScope = '';
  cachedPet = null;
  hasLoaded = false;
}

export function activePetCacheLoaded(scopeKey: string | null | undefined): boolean {
  return Boolean(scopeKey && scopeKey === cachedScope && hasLoaded);
}
