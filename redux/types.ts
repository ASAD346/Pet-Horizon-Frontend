import type { ApiUser } from '@/types/auth';
import type { ApiPet } from '@/types/pet';

export interface AuthState {
  user: ApiUser | null;
  token: string | null;
  activePet: ApiPet | null;
  isBootstrapping: boolean;
}

export interface ToastState {
  message: string | null;
  type?: 'success' | 'error' | 'info';
}

export interface UiState {
  isFormReadOnly: boolean;
}

export interface FamilyState {
  members: any[];
}

export interface AppState {
  auth: AuthState;
  toast: ToastState;
  ui: UiState;
  family: FamilyState;
}
