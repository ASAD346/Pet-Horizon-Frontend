import { combineReducers, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession } from '@/types/auth';
import type { AppState, AuthState, ToastState, UiState, FamilyState } from './types';

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

const initialFamilyState: FamilyState = {
  members: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
    },
    bootstrapComplete: (state) => {
      state.isBootstrapping = false;
    },
  },
});

const toastSlice = createSlice({
  name: 'toast',
  initialState: initialToastState,
  reducers: {
    showToast: (state, action: PayloadAction<{ message: string; type: ToastState['type'] }>) => {
      state.message = action.payload.message;
      state.type = action.payload.type;
    },
    hideToast: (state) => {
      state.message = null;
      state.type = undefined;
    },
  },
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUiState,
  reducers: {
    setFormReadOnly: (state, action: PayloadAction<boolean>) => {
      state.isFormReadOnly = action.payload;
    },
  },
});

const familySlice = createSlice({
  name: 'family',
  initialState: initialFamilyState,
  reducers: {
    updateMemberPermissionsSuccess: (state, action: PayloadAction<{ memberId: string; permissions: any }>) => {
      state.members = state.members.map((m: any) =>
        String(m._id || m.id || m.userId?._id) === String(action.payload.memberId)
          ? { ...m, permissions: action.payload.permissions }
          : m
      );
    },
  },
});

export const {
  setSession: setSessionAction,
  clearSession: clearSessionAction,
  bootstrapComplete: bootstrapCompleteAction,
} = authSlice.actions;

export const {
  showToast: showToastActionInternal,
  hideToast: hideToastAction,
} = toastSlice.actions;

export const {
  setFormReadOnly: setFormReadOnlyAction,
} = uiSlice.actions;

export const {
  updateMemberPermissionsSuccess,
} = familySlice.actions;

export const rootReducer = combineReducers({
  auth: authSlice.reducer,
  toast: toastSlice.reducer,
  ui: uiSlice.reducer,
  family: familySlice.reducer,
});

export type { AppState, AuthState, ToastState, UiState, FamilyState } from './types';

// Typed selectors
export const selectAuthUser = (state: AppState) => state.auth.user;
export const selectAuthToken = (state: AppState) => state.auth.token;
export const selectIsAuthenticated = (state: AppState) => Boolean(state.auth.token);
export const selectIsBootstrapping = (state: AppState) => state.auth.isBootstrapping;
export const selectToastMessage = (state: AppState) => state.toast.message;
export const selectToastType = (state: AppState) => state.toast.type;
export const selectIsFormReadOnly = (state: AppState) => state.ui.isFormReadOnly;
export const selectActivePetId = (state: AppState) => state.auth.user?.activePetId || null;
