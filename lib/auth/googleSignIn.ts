import { GoogleSignin } from '@react-native-google-signin/google-signin';

/** Android OAuth client (package + SHA-1 in Google Cloud Console). */
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ||
  '162625002184-j28egm3lo9ugaeem48pp0enuc32snv82.apps.googleusercontent.com';

/**
 * Web OAuth client — required for Android to return an ID token.
 * Create under Google Cloud Console → APIs & Services → Credentials → Web application.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  '162625002184-7od2ds6dt24bt7cs23825jkoafidov8f.apps.googleusercontent.com';

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured) return;

  const webClientId = GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID;
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);
}
