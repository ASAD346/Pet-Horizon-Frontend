import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { getAuthGoogleErrorMessage } from '@/lib/auth/authErrors';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/errors';
import {
  isGoogleSignInSupported,
  requestGoogleIdToken,
  signOutGoogle,
} from '@/lib/auth/googleSignIn';
import { log } from '@/lib/log';

export function useGoogleAuth() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const inFlightRef = useRef(false);

  const navigateAfterAuth = useCallback(
    (activePetId?: string | null) => {
      if (activePetId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/pet/register');
      }
    },
    [router],
  );

  const handleGoogleSignIn = useCallback(
    async (onError?: (message: string) => void) => {
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setGoogleLoading(true);

      try {
        const idToken = await requestGoogleIdToken();
        const session = await loginWithGoogle(idToken);
        log.ok('GoogleAuth', 'UI success — routing', {
          activePetId: session.user.activePetId ?? null,
        });
        navigateAfterAuth(session.user.activePetId);
      } catch (error) {
        if (error instanceof Error && error.name === 'GoogleSignInCancelledError') {
          return;
        }
        if (error instanceof ApiError) {
          await signOutGoogle().catch(() => {});
        }
        const message = getAuthGoogleErrorMessage(error);
        log.fail('GoogleAuth', 'UI error', message);
        onError?.(message);
      } finally {
        inFlightRef.current = false;
        setGoogleLoading(false);
      }
    },
    [loginWithGoogle, navigateAfterAuth],
  );

  return {
    handleGoogleSignIn,
    googleLoading,
    googleSignInAvailable: isGoogleSignInSupported(),
  };
}
