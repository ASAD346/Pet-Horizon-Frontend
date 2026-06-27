import { useCallback, useEffect, useState } from 'react';
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
  const [pet, setPet] = useState<ApiPet | null>(() => getActivePetCache(token) || null);
  const [loading, setLoading] = useState(() => Boolean(token && !activePetCacheLoaded(token)));

  const reload = useCallback(async (force = false) => {
    if (!token) {
      setPet(null);
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
        setPet(null);
        clearActivePetCache();
        log.info('Home', 'No active pet');
        return;
      }
      const active = await fetchPetById(token, activePetId);
      setPet(active);
      setActivePetCache(token, active);
    } catch (error) {
      if (!cached) {
        setPet(null);
        clearActivePetCache();
      }
      log.fail('Home', 'Load active pet failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusReload(reload, Boolean(token));

  useEffect(() => {
    setPet(getActivePetCache(token) || null);
    setLoading(Boolean(token && !activePetCacheLoaded(token)));
    if (token) {
      void reload(true);
    }
  }, [token, reload]);

  return { pet, loading, reload };
}

