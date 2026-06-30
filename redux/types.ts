import type { ApiUser } from '@/types/auth';

export interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isBootstrapping: boolean;
}

export interface ToastState {
  message: string | null;
  type?: 'success' | 'error' | 'info';
}

export interface UiState {
  isFormReadOnly: boolean;
}

export interface AppState {
  auth: AuthState;
  toast: ToastState;
  ui: UiState;
}
