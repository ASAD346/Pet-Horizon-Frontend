import { combineReducers, type AnyAction } from 'redux';
import {
  AUTH_BOOTSTRAP_COMPLETE,
  AUTH_CLEAR_SESSION,
  AUTH_SET_SESSION,
  HIDE_TOAST,
  SHOW_TOAST,
} from './action-types';
import type { AppState, AuthState, ToastState } from './types';

const initialAuthState: AuthState = {
  user: null,
  token: null,
  isBootstrapping: true,
};

const initialToastState: ToastState = {
  message: null,
};

function authReducer(state = initialAuthState, action: AnyAction): AuthState {
  switch (action.type) {
    case AUTH_SET_SESSION:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
      };
    case AUTH_CLEAR_SESSION:
      return {
        ...state,
        user: null,
        token: null,
      };
    case AUTH_BOOTSTRAP_COMPLETE:
      return {
        ...state,
        isBootstrapping: false,
      };
    default:
      return state;
  }
}

function toastReducer(state = initialToastState, action: AnyAction): ToastState {
  switch (action.type) {
    case SHOW_TOAST:
      return { message: action.payload };
    case HIDE_TOAST:
      return { message: null };
    default:
      return state;
  }
}

export const rootReducer = combineReducers({
  auth: authReducer,
  toast: toastReducer,
});

export type { AppState, AuthState, ToastState } from './types';

export const selectAuthUser = (state: AppState) => state.auth.user;
export const selectAuthToken = (state: AppState) => state.auth.token;
export const selectIsAuthenticated = (state: AppState) => Boolean(state.auth.token);
export const selectIsBootstrapping = (state: AppState) => state.auth.isBootstrapping;
export const selectToastMessage = (state: AppState) => state.toast.message;
