import { isExpoGo } from '@/lib/runtime/isExpoGo';

/** Android OAuth client (package + SHA-1 in Google Cloud Console). */
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ||
  '162625002184-jgchdof16dl3otkkfto07ap9549itj50.apps.googleusercontent.com';

/**
 * Web OAuth client — required for Android to return an ID token.
 * Create under Google Cloud Console → APIs & Services → Credentials → Web application.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  '162625002184-l2gck6jqt4qovmr9e1f6b1h8cntafvjt.apps.googleusercontent.com';

const EXPO_GO_MESSAGE =
  'Continue with Google requires the Pet Horizon APK (EAS build). It does not work in Expo Go — install the latest APK on your phone.';

/** Default React Native debug keystore — used by local release APK builds. */
export const LOCAL_RELEASE_SHA1 =
  '5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25';

/** Google Play App Signing key SHA-1 — used by store-distributed builds. */
export const PLAY_STORE_SHA1 =
  '8A:7C:ED:C1:17:A1:AA:1D:33:E0:6F:B9:32:9D:B9:9D:00:E4:E8:C1';

export const ANDROID_PACKAGE_NAME = 'com.anonymous.PetHorizon';

export function getGoogleDeveloperErrorMessage(): string {
  return (
    'Google Sign-In is not configured for this APK. In Firebase Console → Project Settings → Pet Horizon Android app, add the matching SHA-1 fingerprint:\n' +
    `- For Local/Debug builds: ${LOCAL_RELEASE_SHA1}\n` +
    `- For Play Store/Internal builds: ${PLAY_STORE_SHA1}\n\n` +
    'Then download a fresh google-services.json, run `npm run google:sync-android`, rebuild, and reinstall.'
  );
}

function isGoogleDeveloperError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toUpperCase();
  if (message.includes('DEVELOPER_ERROR') || message.includes('DEVELOPER ERROR')) return true;
  const code = (error as Error & { code?: string | number }).code;
  return code === 10 || code === '10';
}

let configured = false;

export function isGoogleSignInSupported(): boolean {
  return !isExpoGo();
}

export function getGoogleSignInUnavailableMessage(): string {
  return EXPO_GO_MESSAGE;
}

export async function configureGoogleSignIn(): Promise<void> {
  if (configured || !isGoogleSignInSupported()) return;

  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  const webClientId = GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID;
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export async function requestGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInSupported()) {
    throw new Error(EXPO_GO_MESSAGE);
  }

  const {
    GoogleSignin,
    isSuccessResponse,
  } = await import('@react-native-google-signin/google-signin');

  try {
    await configureGoogleSignIn();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      const cancelled = new Error('Google sign-in was cancelled');
      cancelled.name = 'GoogleSignInCancelledError';
      throw cancelled;
    }

    let idToken = response.data.idToken;
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }
    if (!idToken) {
      throw new Error(
        'Google did not return a sign-in token. Rebuild the APK after setting EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.',
      );
    }

    return idToken;
  } catch (error) {
    const { isErrorWithCode, statusCodes } = await import('@react-native-google-signin/google-signin');
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      const cancelled = new Error('Google sign-in was cancelled');
      cancelled.name = 'GoogleSignInCancelledError';
      throw cancelled;
    }
    if (isGoogleDeveloperError(error)) {
      throw new Error(getGoogleDeveloperErrorMessage());
    }
    throw error;
  }
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);
}

/** Clears cached Google account so the account picker shows again after a failed login. */
export async function signOutGoogle(): Promise<void> {
  if (!isGoogleSignInSupported()) return;
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  await GoogleSignin.signOut();
}
