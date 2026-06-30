import { combineReducers, type AnyAction } from 'redux';
import {
  AUTH_BOOTSTRAP_COMPLETE,
  AUTH_CLEAR_SESSION,
  AUTH_SET_SESSION,
  HIDE_TOAST,
  SHOW_TOAST,
  SET_FORM_READ_ONLY,
  UPDATE_MEMBER_PERMISSIONS_SUCCESS,
} from './action-types';
import type { AppState, AuthState, ToastState, UiState } from './types';

const initialAuthState: AuthState = {
  user: null,
  token: null,
  isBootstrapping: true,
};

const initialToastState: ToastState = {
  message: null,
};

const initialUiState: UiState = {
  isFormReadOnly: false,
};

interface FamilyState {
  members: any[];
}

const initialFamilyState: FamilyState = {
  members: [],
};

function familyReducer(state = initialFamilyState, action: AnyAction): FamilyState {
  switch (action.type) {
    case UPDATE_MEMBER_PERMISSIONS_SUCCESS:
      return {
        ...state,
        members: state.members.map((m: any) =>
          String(m._id || m.id || m.userId?._id) === String(action.payload.memberId)
            ? { ...m, permissions: action.payload.permissions }
            : m
        ),
      };
    default:
      return state;
  }
}

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
      return { message: action.payload.message, type: action.payload.type };
    case HIDE_TOAST:
      return { message: null, type: undefined };
    default:
      return state;
  }
}

function uiReducer(state = initialUiState, action: AnyAction): UiState {
  switch (action.type) {
    case SET_FORM_READ_ONLY:
      return { ...state, isFormReadOnly: action.payload };
    default:
      return state;
  }
}

export const rootReducer = combineReducers({
  auth: authReducer,
  toast: toastReducer,
  ui: uiReducer,
  family: familyReducer,
});

export type { AppState, AuthState, ToastState, UiState } from './types';
export const selectAuthUser = (state: AppState) => state.auth.user;
export const selectAuthToken = (state: AppState) => state.auth.token;
export const selectIsAuthenticated = (state: AppState) => Boolean(state.auth.token);
export const selectIsBootstrapping = (state: AppState) => state.auth.isBootstrapping;
export const selectToastMessage = (state: AppState) => state.toast.message;
export const selectToastType = (state: AppState) => state.toast.type;
export const selectIsFormReadOnly = (state: AppState) => state.ui.isFormReadOnly;
