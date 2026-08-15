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
import { useAuth } from './useAuth';

export function useActivePet(token: string | null) {
  const { user, setSession } = useAuth();
  const activePetId = user?.activePetId || null;
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
      const { activePetId: serverActivePetId } = await fetchActivePetId(token);
      
      // Preserve User Intent: If activePetId is already set in local Redux state,
      // lock that selection and do not let background API calls overwrite it.
      const targetId = activePetId || serverActivePetId;
      if (!targetId) {
        setPet(null);
        clearActivePetCache();
        log.info('Home', 'No active pet');
        return;
      }
      const active = await fetchPetById(token, targetId);
      setPet(active);
      setActivePetCache(token, active);

      // Sync loaded state back to Redux session to lock it
      if (user && user.activePetId !== targetId) {
        await setSession({
          token,
          user: { ...user, activePetId: targetId },
        });
      }
    } catch (error) {
      if (!cached) {
        setPet(null);
        clearActivePetCache();
      }
      log.fail('Home', 'Load active pet failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, activePetId, user, setSession]);

  useFocusReload(reload, Boolean(token));

  useEffect(() => {
    setPet(getActivePetCache(token) || null);
    setLoading(Boolean(token && !activePetCacheLoaded(token)));
    if (token) {
      void reload(true);
    }
  }, [token, activePetId, reload]);

  return { pet, loading, reload };
}

