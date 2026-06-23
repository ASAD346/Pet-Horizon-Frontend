import type { PetPermissionsResponse } from '@/types/pet';
import AsyncStorage from '@react-native-async-storage/async-storage';

let cachedScope = '';
let cachedPermissions: PetPermissionsResponse | null = null;
let hasLoaded = false;

export function getPetPermissionCache(scopeKey: string | null | undefined): PetPermissionsResponse | null {
  if (!scopeKey || scopeKey !== cachedScope) return null;
  return cachedPermissions;
}

export function setPetPermissionCache(scopeKey: string, permissions: PetPermissionsResponse) {
  cachedScope = scopeKey;
  cachedPermissions = permissions;
  hasLoaded = true;
  AsyncStorage.setItem(
    'pet_horizon_cached_pet_permissions',
    JSON.stringify({ scopeKey, permissions }),
  ).catch(() => {});
}

export function clearPetPermissionCache() {
  cachedScope = '';
  cachedPermissions = null;
  hasLoaded = false;
  AsyncStorage.removeItem('pet_horizon_cached_pet_permissions').catch(() => {});
}

export function petPermissionCacheLoaded(scopeKey: string | null | undefined): boolean {
  return Boolean(scopeKey && scopeKey === cachedScope && hasLoaded);
}

// Synchronous helper for bootstrap initialization
export function initializePetPermissionCache(scopeKey: string, permissions: PetPermissionsResponse) {
  cachedScope = scopeKey;
  cachedPermissions = permissions;
  hasLoaded = true;
}
