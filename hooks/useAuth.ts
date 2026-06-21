import { useCallback } from 'react';
import { login, loginWithGoogle, logout, setSession } from '@/redux/action';
import {
  selectAuthToken,
  selectAuthUser,
  selectIsAuthenticated,
  selectIsBootstrapping,
} from '@/redux/reducer';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import type { AuthSession } from '@/types/auth';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const token = useAppSelector(selectAuthToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isBootstrapping = useAppSelector(selectIsBootstrapping);

  return {
    user,
    token,
    isAuthenticated,
    isBootstrapping,
    login: useCallback(
      (email: string, password: string) => dispatch(login(email, password)),
      [dispatch],
    ),
    loginWithGoogle: useCallback(
      (idToken: string) => dispatch(loginWithGoogle(idToken)),
      [dispatch],
    ),
    logout: useCallback(() => dispatch(logout()), [dispatch]),
    setSession: useCallback(
      (session: AuthSession) => dispatch(setSession(session)),
      [dispatch],
    ),
  };
}
