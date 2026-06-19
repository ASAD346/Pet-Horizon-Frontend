import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { loginWithEmailPassword, loginWithGoogle as loginWithGoogleApi } from '@/services/auth/authApi';
import { clearSession, loadSession, saveSession } from '@/services/auth/authStorage';
import type { ApiUser, AuthSession } from '@/types/auth';

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  loginWithGoogle: (idToken: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const stored = await loadSession();
        if (mounted && stored) {
          setSessionState(stored);
          log.ok('Auth', 'Session restored', { userId: stored.user._id });
        } else {
          log.info('Auth', 'No stored session');
        }
      } catch (error) {
        log.fail('Auth', 'Session restore failed', {
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const setSession = useCallback(async (next: AuthSession) => {
    await saveSession(next);
    setSessionState(next);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    log.info('Auth', 'Login attempt', { email: email.trim().toLowerCase() });
    try {
      const response = await loginWithEmailPassword({ email, password });
      const next: AuthSession = { token: response.token, user: response.user };
      await setSession(next);
      log.ok('Auth', 'Session saved', {
        userId: next.user._id,
        activePetId: next.user.activePetId ?? null,
      });
      return next;
    } catch (error) {
      log.fail('Auth', 'Login session not saved');
      throw error;
    }
  }, [setSession]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    log.info('Auth', 'Google login attempt');
    try {
      const response = await loginWithGoogleApi({ idToken });
      const next: AuthSession = { token: response.token, user: response.user };
      await setSession(next);
      log.ok('Auth', 'Google session saved', {
        userId: next.user._id,
        activePetId: next.user.activePetId ?? null,
      });
      return next;
    } catch (error) {
      log.fail('Auth', 'Google login session not saved');
      throw error;
    }
  }, [setSession]);

  const logout = useCallback(async () => {
    await clearSession();
    setSessionState(null);
    log.ok('Auth', 'Logged out');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      isBootstrapping,
      login,
      loginWithGoogle,
      logout,
      setSession,
    }),
    [session, isBootstrapping, login, loginWithGoogle, logout, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function getAuthSignupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    if (error.status === 409) {
      return 'This email is already registered. Try logging in instead.';
    }
    return error.message;
  }
  return 'Unable to create your account. Please try again.';
}

export function getAuthVerifyEmailErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    return error.message;
  }
  return 'Unable to verify your email. Please try again.';
}

export function getAuthGoogleErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.code === 'TIMEOUT') {
      return 'Could not reach the server. Check your connection and try again.';
    }
    if (error.status === 503) {
      return 'Google sign-in is not configured on the server yet. Please try email login.';
    }
    if (error.status === 404) {
      return 'Google sign-in is not available on the server yet. Ask the developer to redeploy the backend with the latest code.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to sign in with Google. Please try again.';
}

export function getAuthLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError || error.code === 'TIMEOUT') {
      return 'Could not reach the server. Check your connection and try again.';
    }
    if (error.isUnauthorized) {
      return 'Incorrect email or password. Please try again.';
    }
    if (error.isForbidden) {
      return error.message;
    }
    return error.message;
  }
  return 'Unable to sign in. Please try again.';
}

export function getAuthForgotPasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    return error.message;
  }
  return 'Unable to send a reset code. Please try again.';
}

export function getAuthResetPasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return error.message;
    }
    if (error.status === 400) {
      return error.message || 'Invalid or expired reset code. Request a new one.';
    }
    return error.message;
  }
  return 'Unable to reset your password. Please try again.';
}
