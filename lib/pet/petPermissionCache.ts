import type { PetPermissionsResponse } from '@/types/pet';

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
}

export function clearPetPermissionCache() {
  cachedScope = '';
  cachedPermissions = null;
  hasLoaded = false;
}

export function petPermissionCacheLoaded(scopeKey: string | null | undefined): boolean {
  return Boolean(scopeKey && scopeKey === cachedScope && hasLoaded);
}
