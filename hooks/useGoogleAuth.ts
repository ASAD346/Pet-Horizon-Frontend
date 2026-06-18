import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth, getAuthGoogleErrorMessage } from '@/contexts/AuthContext';
import { configureGoogleSignIn } from '@/lib/auth/googleSignIn';
import { log } from '@/lib/log';

class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in was cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}

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
        configureGoogleSignIn();
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();

        if (!isSuccessResponse(response)) {
          throw new GoogleSignInCancelledError();
        }

        let idToken = response.data.idToken;
        if (!idToken) {
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens.idToken;
        }
        if (!idToken) {
          throw new Error(
            'Google did not return a sign-in token. Add a Web OAuth client in Google Cloud Console and set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env, then rebuild the APK.',
          );
        }

        const session = await loginWithGoogle(idToken);
        log.ok('GoogleAuth', 'UI success — routing', {
          activePetId: session.user.activePetId ?? null,
        });
        navigateAfterAuth(session.user.activePetId);
      } catch (error) {
        if (error instanceof GoogleSignInCancelledError) {
          return;
        }
        if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
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

  return { handleGoogleSignIn, googleLoading };
}
