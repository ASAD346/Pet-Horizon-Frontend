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

export function useActivePet(token: string | null) {
  const [pet, setPet] = useState<ApiPet | null>(() => getActivePetCache(token));
  const [loading, setLoading] = useState(() => Boolean(token && !activePetCacheLoaded(token)));

  const reload = useCallback(async () => {
    if (!token) {
      setPet(null);
      clearActivePetCache();
      setLoading(false);
      return;
    }

    const cached = getActivePetCache(token);
    if (cached) {
      setPet(cached);
    }

    const block = !activePetCacheLoaded(token);
    if (block) setLoading(true);

    try {
      const { activePetId } = await fetchActivePetId(token);
      if (!activePetId) {
        setPet(null);
        setActivePetCache(token, null);
        log.info('Home', 'No active pet');
        return;
      }
      const active = await fetchPetById(token, activePetId);
      setPet(active);
      setActivePetCache(token, active);
    } catch (error) {
      if (!activePetCacheLoaded(token)) {
        setPet(null);
      }
      log.fail('Home', 'Load active pet failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusReload(reload, Boolean(token));

  return { pet, loading, reload };
}
