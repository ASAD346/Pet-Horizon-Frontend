import { combineReducers, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession } from '@/types/auth';
import type { ApiPet } from '@/types/pet';
import type { AppState, AuthState, ToastState, UiState, FamilyState, UpgradeModalState } from './types';

const initialAuthState: AuthState = {
  user: null,
  token: null,
  activePet: null,
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

const initialUpgradeModalState: UpgradeModalState = {
  visible: false,
  title: undefined,
  message: undefined,
  feature: undefined,
  onCancelRedirectBack: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Synchronize activePet if user activePetId is specified and activePet._id matches
      if (state.activePet && action.payload.user?.activePetId && state.activePet._id !== action.payload.user.activePetId) {
        // Do not immediately nullify if activePet exists; keep activePet unless explicit logout/clear
      }
    },
    setActivePet: (state, action: PayloadAction<ApiPet | null>) => {
      state.activePet = action.payload;
      if (action.payload && state.user) {
        state.user.activePetId = action.payload._id;
      } else if (!action.payload && state.user) {
        state.user.activePetId = null;
      }
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.activePet = null;
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

const upgradeModalSlice = createSlice({
  name: 'upgradeModal',
  initialState: initialUpgradeModalState,
  reducers: {
    showUpgradeModal: (
      state,
      action: PayloadAction<{
        title?: string;
        message?: string;
        feature?: 'pets' | 'family' | 'photos' | 'general';
        onCancelRedirectBack?: boolean;
      } | undefined>
    ) => {
      state.visible = true;
      state.title = action?.payload?.title;
      state.message = action?.payload?.message;
      state.feature = action?.payload?.feature ?? 'general';
      state.onCancelRedirectBack = Boolean(action?.payload?.onCancelRedirectBack);
    },
    hideUpgradeModal: (state) => {
      state.visible = false;
      state.title = undefined;
      state.message = undefined;
      state.feature = undefined;
      state.onCancelRedirectBack = false;
    },
  },
});

export const {
  setSession: setSessionAction,
  setActivePet: setActivePetAction,
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

export const {
  showUpgradeModal: showUpgradeModalActionInternal,
  hideUpgradeModal: hideUpgradeModalAction,
} = upgradeModalSlice.actions;

export const rootReducer = combineReducers({
  auth: authSlice.reducer,
  toast: toastSlice.reducer,
  ui: uiSlice.reducer,
  family: familySlice.reducer,
  upgradeModal: upgradeModalSlice.reducer,
});

export type { AppState, AuthState, ToastState, UiState, FamilyState, UpgradeModalState } from './types';

// Typed selectors
export const selectAuthUser = (state: AppState) => state.auth.user;
export const selectAuthToken = (state: AppState) => state.auth.token;
export const selectActivePet = (state: AppState) => state.auth.activePet;
export const selectIsAuthenticated = (state: AppState) => Boolean(state.auth.token);
export const selectIsBootstrapping = (state: AppState) => state.auth.isBootstrapping;
export const selectToastMessage = (state: AppState) => state.toast.message;
export const selectToastType = (state: AppState) => state.toast.type;
export const selectIsFormReadOnly = (state: AppState) => state.ui.isFormReadOnly;
export const selectActivePetId = (state: AppState) => state.auth.activePet?._id || state.auth.user?.activePetId || null;
export const selectUpgradeModal = (state: AppState) => state.upgradeModal;
