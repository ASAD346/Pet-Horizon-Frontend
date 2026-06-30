import { useCallback, useEffect, useMemo, useState } from 'react';

import { useStaleLoadScope } from '@/hooks/useStaleLoadScope';
import {
  buildPetAccessControls,
  type PetAccessControls,
} from '@/lib/pet/petPermissionAccess';
import {
  getPetPermissionCache,
  petPermissionCacheLoaded,
  setPetPermissionCache,
} from '@/lib/pet/petPermissionCache';
import { fetchPetPermissions } from '@/services/schedules/feedingApi';
import type { ApiPet } from '@/types/pet';
import type { PetPermissionsResponse } from '@/types/pet';

export interface UsePetPermissionsResult extends PetAccessControls {
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const EMPTY_ACCESS = buildPetAccessControls({
  permissions: null,
  petOwnerUserId: null,
  userId: undefined,
  species: null,
});

export function usePetPermissions(
  token: string | null,
  pet: ApiPet | null | undefined,
  userId?: string,
): UsePetPermissionsResult {
  const scopeKey = token && pet?._id ? `${token}:${pet._id}` : null;
  const cached = getPetPermissionCache(scopeKey);
  const [permissions, setPermissions] = useState<PetPermissionsResponse | null>(cached);
  const [loading, setLoading] = useState(() => Boolean(scopeKey && !petPermissionCacheLoaded(scopeKey)));
  const [error, setError] = useState<string | null>(null);
  const { shouldBlockUI, markLoaded } = useStaleLoadScope(scopeKey);

  const reload = useCallback(async () => {
    if (!token || !pet?._id || pet._id === 'fallback-pet-id-123') {
      setPermissions(null);
      setLoading(false);
      setError(null);
      return;
    }

    const block = shouldBlockUI();
    if (block) setLoading(true);

    try {
      const data = await fetchPetPermissions(token, pet._id);
      setPermissions(data);
      setPetPermissionCache(`${token}:${pet._id}`, data);
      setError(null);
      markLoaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load pet permissions.');
    } finally {
      setLoading(false);
    }
  }, [token, pet?._id, shouldBlockUI, markLoaded]);

  useEffect(() => {
    if (!scopeKey || pet?._id === 'fallback-pet-id-123') {
      setPermissions(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cachedPermissions = getPetPermissionCache(scopeKey);
    if (cachedPermissions) {
      setPermissions(cachedPermissions);
      setLoading(false);
    }

    void reload();

    // Aggressive polling / background-sync to catch admin permission updates in real-time
    const intervalId = setInterval(() => {
      void reload();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [scopeKey, reload, pet?._id]);

  const access = useMemo(
    () =>
      pet
        ? buildPetAccessControls({
            permissions,
            petOwnerUserId: pet.ownerUserId,
            userId,
            species: pet.species,
          })
        : EMPTY_ACCESS,
    [permissions, pet, userId],
  );

  return {
    ...access,
    loading,
    error,
    reload,
  };
}
