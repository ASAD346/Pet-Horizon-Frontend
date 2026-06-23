import type { ApiPet } from '@/types/pet';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  if (pet) {
    AsyncStorage.setItem('pet_horizon_cached_active_pet', JSON.stringify(pet)).catch(() => {});
  } else {
    AsyncStorage.removeItem('pet_horizon_cached_active_pet').catch(() => {});
  }
}

export function clearActivePetCache() {
  cachedScope = '';
  cachedPet = null;
  hasLoaded = false;
  AsyncStorage.removeItem('pet_horizon_cached_active_pet').catch(() => {});
}

export function activePetCacheLoaded(scopeKey: string | null | undefined): boolean {
  return Boolean(scopeKey && scopeKey === cachedScope && hasLoaded);
}

// Synchronous helper for bootstrap initialization
export function initializeActivePetCache(scopeKey: string, pet: ApiPet | null) {
  cachedScope = scopeKey;
  cachedPet = pet;
  hasLoaded = true;
}
