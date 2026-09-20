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
  const activePetId = reduxPet?._id || user?.activePetId || null;

  const [localPet, setLocalPet] = useState<ApiPet | null>(() => reduxPet || getActivePetCache(token) || null);
  const currentPet = reduxPet || localPet;
  const [loading, setLoading] = useState(() => Boolean(token && !currentPet && !activePetCacheLoaded(token)));

  const reload = useCallback(async (force = false) => {
    if (!token) {
      setLocalPet(null);
      dispatch(setActivePetAction(null));
      clearActivePetCache();
      setLoading(false);
      return;
    }

    const cacheLoaded = activePetCacheLoaded(token);
    const cached = getActivePetCache(token);

    if (cached && !reduxPet) {
      setLocalPet(cached);
      dispatch(setActivePetAction(cached));
    }

    if (cacheLoaded && !force && (reduxPet || cached)) {
      return;
    }

    const block = !reduxPet && !cached;
    if (block) setLoading(true);

    try {
      const { activePetId: serverActivePetId } = await fetchActivePetId(token);
      
      const targetId = activePetId || serverActivePetId;
      if (!targetId) {
        setLocalPet(null);
        dispatch(setActivePetAction(null));
        clearActivePetCache();
        log.info('Home', 'No active pet');
        return;
      }

      const active = await fetchPetById(token, targetId);
      setLocalPet(active);
      dispatch(setActivePetAction(active));
      setActivePetCache(token, active);

      if (user && user.activePetId !== targetId) {
        await setSession({
          token,
          user: { ...user, activePetId: targetId },
        });
      }
    } catch (error) {
      if (!currentPet && !cached) {
        setLocalPet(null);
        dispatch(setActivePetAction(null));
        clearActivePetCache();
      }
      log.fail('Home', 'Load active pet failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token, activePetId, user, setSession, dispatch, reduxPet, currentPet]);

  useFocusReload(reload, Boolean(token));

  useEffect(() => {
    if (reduxPet) {
      setLocalPet(reduxPet);
      setLoading(false);
    } else {
      const cached = getActivePetCache(token);
      if (cached) {
        setLocalPet(cached);
        dispatch(setActivePetAction(cached));
      }
    }
  }, [reduxPet, token, dispatch]);

  useEffect(() => {
    if (token && !reduxPet) {
      void reload(false);
    }
  }, [token, activePetId, reload, reduxPet]);

  return { pet: currentPet, loading, reload };
}

