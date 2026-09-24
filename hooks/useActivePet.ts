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
import { store, useAppDispatch, useAppSelector } from '@/redux/store';
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

      const currentAuth = store.getState().auth;
      const currentReduxPet = currentAuth.activePet;
      const authPetId = currentAuth.user?.activePetId ?? null;

      // If not forced and Redux already holds the active pet matching user's selection, do nothing
      if (!force && currentReduxPet && (!authPetId || currentReduxPet._id === authPetId)) {
        return;
      }

      const cached = getActivePetCache(token);
      if (cached && !currentReduxPet) {
        if (!authPetId || cached._id === authPetId) {
          dispatch(setActivePetAction(cached));
        } else {
          clearActivePetCache();
        }
      }

      const cacheLoaded = activePetCacheLoaded(token);
      const stillCached = getActivePetCache(token);
      if (cacheLoaded && !force && (currentReduxPet || stillCached)) {
        return;
      }

      if (!currentReduxPet && !stillCached) setLoading(true);

      try {
        // Read live authoritative ID directly from store to avoid stale closure
        const liveAuth = store.getState().auth;
        let targetId = liveAuth.user?.activePetId || liveAuth.activePet?._id || null;

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

        const latestUser = store.getState().auth.user;
        if (latestUser && latestUser.activePetId !== targetId) {
          await setSession({
            token,
            user: { ...latestUser, activePetId: targetId },
          });
        }
      } catch (error) {
        const livePet = store.getState().auth.activePet;
        if (!livePet && !stillCached) {
          dispatch(setActivePetAction(null));
          clearActivePetCache();
        }
        log.fail('Home', 'Load active pet failed', getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [token, setSession, dispatch],
  );

  useFocusReload(reload, Boolean(token));

  // Sync initial cache if Redux is empty on mount.
  // Only restore from cache when it matches user.activePetId (the authority).
  // If the cache holds a different pet, it is stale — evict and reload.
  useEffect(() => {
    if (!reduxPet && token) {
      const cached = getActivePetCache(token);
      const authPetId = user?.activePetId ?? null;
      if (cached) {
        if (!authPetId || cached._id === authPetId) {
          dispatch(setActivePetAction(cached));
        } else {
          // Cache is stale — clear it so it cannot interfere, then reload correctly.
          clearActivePetCache();
          void reload(false);
        }
      } else {
        void reload(false);
      }
    }
  }, [reduxPet, token, user?.activePetId, dispatch, reload]);

  return { pet: reduxPet, loading: loading && !reduxPet, reload };
}

