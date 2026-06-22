import type { ApiPet } from '@/types/pet';

let cachedScope = '';
let cachedPets: ApiPet[] = [];
let hasLoaded = false;

export function getPetListCache(scopeKey: string | null | undefined): ApiPet[] | null {
  if (!scopeKey || scopeKey !== cachedScope) return null;
  return cachedPets;
}

export function setPetListCache(scopeKey: string, pets: ApiPet[]) {
  cachedScope = scopeKey;
  cachedPets = pets;
  hasLoaded = true;
}

export function clearPetListCache() {
  cachedScope = '';
  cachedPets = [];
  hasLoaded = false;
}

export function petListCacheLoaded(scopeKey: string | null | undefined): boolean {
  return Boolean(scopeKey && scopeKey === cachedScope && hasLoaded);
}
