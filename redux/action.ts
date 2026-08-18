import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';
import { log } from '@/lib/log';
import { loginWithEmailPassword, loginWithGoogle as loginWithGoogleApi } from '@/services/auth/authApi';
import { clearSession, loadSession, saveSession } from '@/services/auth/authStorage';
import type { AuthSession } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeActivePetCache } from '@/lib/pet/activePetCache';
import { initializePetPermissionCache, clearPetPermissionCache } from '@/lib/pet/petPermissionCache';
import { queryClient } from '@/app/_layout';
import {
  setSessionAction,
  clearSessionAction,
  bootstrapCompleteAction,
  showToastActionInternal,
  hideToastAction,
  setFormReadOnlyAction,
  updateMemberPermissionsSuccess,
} from './reducer';
import type { AppState, ToastState } from './types';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  UnknownAction
>;

export type AppAction = UnknownAction;

export const showToastAction = (message: string, type: ToastState['type'] = 'info') =>
  showToastActionInternal({ message, type });

// Re-export actions for backward compatibility
export {
  setSessionAction,
  clearSessionAction,
  bootstrapCompleteAction,
  hideToastAction,
  setFormReadOnlyAction,
  updateMemberPermissionsSuccess,
};

export function bootstrapAuth(): AppThunk {
  return async (dispatch) => {
    try {
      const stored = await loadSession();
      if (stored) {
        dispatch(setSessionAction(stored));
        log.ok('Auth', 'Session restored', { userId: stored.user._id });
        
        try {
          const cachedPetJson = await AsyncStorage.getItem('pet_horizon_cached_active_pet');
          if (cachedPetJson) {
            const pet = JSON.parse(cachedPetJson);
            if (pet && typeof pet._id === 'string') {
              initializeActivePetCache(stored.token, pet);
              log.ok('Auth', 'Cached active pet restored', { petId: pet._id });
            } else {
              log.warn('Auth', 'Discarding corrupted cached active pet', { petId: pet?._id });
              await AsyncStorage.removeItem('pet_horizon_cached_active_pet');
            }
          }
        } catch (e) {
          log.warn('Auth', 'Failed to load cached pet on bootstrap', {
            message: e instanceof Error ? e.message : String(e),
          });
        }

        try {
          const cachedPermsJson = await AsyncStorage.getItem('pet_horizon_cached_pet_permissions');
          if (cachedPermsJson) {
            const { scopeKey, permissions } = JSON.parse(cachedPermsJson);
            if (scopeKey && permissions) {
              initializePetPermissionCache(scopeKey, permissions);
              log.ok('Auth', 'Cached pet permissions restored');
            }
          }
        } catch (e) {
          log.warn('Auth', 'Failed to load cached permissions on bootstrap', {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      } else {
        log.info('Auth', 'No stored session');
      }
    } catch (error) {
      log.fail('Auth', 'Session restore failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      dispatch(bootstrapCompleteAction());
    }
  };
}

export function setSession(session: AuthSession): AppThunk<Promise<void>> {
  return async (dispatch) => {
    await saveSession(session);
    dispatch(setSessionAction(session));
    // Invalidate subscription query cache to propagate changes instantly across all screens
    try {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } catch (e) {
      log.warn('Auth', 'Failed to invalidate subscription queries on session update', {
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };
}

export function login(email: string, password: string): AppThunk<Promise<AuthSession>> {
  return async (dispatch) => {
    log.info('Auth', 'Login attempt', { email: email.trim().toLowerCase() });
    try {
      const response = await loginWithEmailPassword({ email, password });
      const next: AuthSession = { token: response.token, user: response.user };
      await dispatch(setSession(next));
      log.ok('Auth', 'Session saved', {
        userId: next.user._id,
        activePetId: next.user.activePetId ?? null,
      });
      return next;
    } catch (error) {
      log.fail('Auth', 'Login session not saved');
      throw error;
    }
  };
}

export function loginWithGoogle(idToken: string): AppThunk<Promise<AuthSession>> {
  return async (dispatch) => {
    log.info('Auth', 'Google login attempt');
    try {
      const response = await loginWithGoogleApi({ idToken });
      const next: AuthSession = { token: response.token, user: response.user };
      await dispatch(setSession(next));
      log.ok('Auth', 'Google session saved', {
        userId: next.user._id,
        activePetId: next.user.activePetId ?? null,
      });
      return next;
    } catch (error) {
      log.fail('Auth', 'Google login session not saved');
      throw error;
    }
  };
}

export function logout(): AppThunk<Promise<void>> {
  return async (dispatch) => {
    clearPetPermissionCache();
    queryClient.clear();
    await clearSession();
    dispatch(clearSessionAction());
    log.ok('Auth', 'Logged out');
  };
}

export function showToast(message: string): AppThunk {
  return (dispatch) => {
    dispatch(showToastAction(message, 'info'));
  };
}
