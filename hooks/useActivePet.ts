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
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { selectActivePet, setActivePetAction } from '@/redux/reducer';

export function useActivePet(token: string | null) {
  const dispatch = useAppDispatch();
  const reduxPet = useAppSelector(selectActivePet);
  const { user, setSession } = useAuth();
  const currentPetId = reduxPet?._id || user?.activePetId || null;

  const [loading, setLoading] = useState(() => Boolean(token && !reduxPet && !activePetCacheLoaded(token)));

  const reload = useCallback(
    async (force = false) => {
      if (!token) {
        dispatch(setActivePetAction(null));
        clearActivePetCache();
        setLoading(false);
        return;
      }

      const cached = getActivePetCache(token);
      if (cached && !reduxPet) {
        dispatch(setActivePetAction(cached));
      }

      const cacheLoaded = activePetCacheLoaded(token);
      if (cacheLoaded && !force && (reduxPet || cached)) {
        return;
      }

      if (!reduxPet && !cached) setLoading(true);

      try {
        // If we already have an active pet ID (from Redux or user), prioritize it to avoid resetting
        let targetId = currentPetId;

        if (!targetId) {
          const { activePetId: serverActivePetId } = await fetchActivePetId(token);
          targetId = serverActivePetId;
        }

        if (!targetId) {
          dispatch(setActivePetAction(null));
          clearActivePetCache();
          log.info('Home', 'No active pet');
          return;
        }

        const active = await fetchPetById(token, targetId);
        dispatch(setActivePetAction(active));
        setActivePetCache(token, active);

        if (user && user.activePetId !== targetId) {
          await setSession({
            token,
            user: { ...user, activePetId: targetId },
          });
        }
      } catch (error) {
        if (!reduxPet && !cached) {
          dispatch(setActivePetAction(null));
          clearActivePetCache();
        }
        log.fail('Home', 'Load active pet failed', getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [token, currentPetId, reduxPet, user, setSession, dispatch],
  );

  useFocusReload(reload, Boolean(token));

  // Sync initial cache if Redux is empty on mount
  useEffect(() => {
    if (!reduxPet && token) {
      const cached = getActivePetCache(token);
      if (cached) {
        dispatch(setActivePetAction(cached));
      } else {
        void reload(false);
      }
    }
  }, [reduxPet, token, dispatch, reload]);

  return { pet: reduxPet, loading: loading && !reduxPet, reload };
}

