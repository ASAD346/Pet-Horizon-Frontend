import type { Action } from 'redux';
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
  AUTH_BOOTSTRAP_COMPLETE,
  AUTH_CLEAR_SESSION,
  AUTH_SET_SESSION,
  HIDE_TOAST,
  SHOW_TOAST,
  SET_FORM_READ_ONLY,
  UPDATE_MEMBER_PERMISSIONS_SUCCESS,
} from './action-types';
import type { AppState, ToastState } from './types';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>;

export interface SetSessionAction {
  type: typeof AUTH_SET_SESSION;
  payload: AuthSession;
}

export interface ClearSessionAction {
  type: typeof AUTH_CLEAR_SESSION;
}

export interface BootstrapCompleteAction {
  type: typeof AUTH_BOOTSTRAP_COMPLETE;
}

export interface ShowToastAction {
  type: typeof SHOW_TOAST;
  payload: { message: string; type: ToastState['type'] };
}

export interface HideToastAction {
  type: typeof HIDE_TOAST;
}

export interface SetFormReadOnlyAction {
  type: typeof SET_FORM_READ_ONLY;
  payload: boolean;
}

export interface UpdateMemberPermissionsSuccessAction {
  type: typeof UPDATE_MEMBER_PERMISSIONS_SUCCESS;
  payload: { memberId: string; permissions: any };
}

export type AppAction =
  | SetSessionAction
  | ClearSessionAction
  | BootstrapCompleteAction
  | ShowToastAction
  | HideToastAction
  | SetFormReadOnlyAction
  | UpdateMemberPermissionsSuccessAction;

export const setSessionAction = (session: AuthSession): SetSessionAction => ({
  type: AUTH_SET_SESSION,
  payload: session,
});

export const clearSessionAction = (): ClearSessionAction => ({
  type: AUTH_CLEAR_SESSION,
});

export const bootstrapCompleteAction = (): BootstrapCompleteAction => ({
  type: AUTH_BOOTSTRAP_COMPLETE,
});

export const showToastAction = (message: string, type: ToastState['type'] = 'info'): ShowToastAction => ({
  type: SHOW_TOAST,
  payload: { message, type },
});

export const hideToastAction = (): HideToastAction => ({
  type: HIDE_TOAST,
});

export const setFormReadOnlyAction = (isReadOnly: boolean): SetFormReadOnlyAction => ({
  type: SET_FORM_READ_ONLY,
  payload: isReadOnly,
});

export const updateMemberPermissionsSuccess = (memberId: string, permissions: any): UpdateMemberPermissionsSuccessAction => ({
  type: UPDATE_MEMBER_PERMISSIONS_SUCCESS,
  payload: { memberId, permissions },
});

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
            initializeActivePetCache(stored.token, pet);
            log.ok('Auth', 'Cached active pet restored', { petId: pet._id });
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
    dispatch(showToastAction(message));
  };
}
