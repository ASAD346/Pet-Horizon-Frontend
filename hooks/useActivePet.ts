import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  activePetCacheLoaded,
  clearActivePetCache,
  getActivePetCache,
  setActivePetCache,
} from '@/lib/pet/activePetCache';
import { fetchActivePetId, fetchPetById } from '@/services/pets/petApi';
import type { ApiPet } from '@/types/pet';
import { useFocusReload } from './useStaleLoadScope';

export const FALLBACK_PET: ApiPet = {
  _id: 'fallback-pet-id-123',
  name: 'Bella',
  species: 'dog',
  breed: 'Golden Retriever',
  gender: 'female',
  birthday: '2022-04-12T00:00:00.000Z',
  weight: 24.5,
  weightUnit: 'kg',
  image: null,
  ownerUserId: 'fallback-owner-user-id',
  familyId: 'fallback-family-id',
};

export function useActivePet(token: string | null) {
  const [pet, setPet] = useState<ApiPet | null>(() => getActivePetCache(token) || FALLBACK_PET);
  const [loading, setLoading] = useState(() => Boolean(token && !activePetCacheLoaded(token)));

  const reload = useCallback(async (force = false) => {
    if (!token) {
      setPet(FALLBACK_PET);
      clearActivePetCache();
      setLoading(false);
      return;
    }

    const cacheLoaded = activePetCacheLoaded(token);
    if (cacheLoaded && !force) {
      return;
    }

    const cached = getActivePetCache(token);
    if (cached) {
      setPet(cached);
    }

    const block = !cacheLoaded;
    if (block) setLoading(true);

    try {
      const { activePetId } = await fetchActivePetId(token);
      if (!activePetId) {
        setPet(FALLBACK_PET);
        setActivePetCache(token, FALLBACK_PET);
        log.info('Home', 'No active pet');
        return;
      }
      const active = await fetchPetById(token, activePetId);
      setPet(active);
      setActivePetCache(token, active);
    } catch (error) {
      if (!cached) {
        setPet(FALLBACK_PET);
        setActivePetCache(token, FALLBACK_PET);
      }
      log.fail('Home', 'Load active pet failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusReload(reload, Boolean(token));

  return { pet, loading, reload };
}
