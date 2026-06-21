import { Redirect, useLocalSearchParams } from 'expo-router';

/** Handles https / deep links like /join/family/:token → invite accept screen. */
export default function JoinFamilyRedirectScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  if (!token) {
    return <Redirect href="/" />;
  }

  return <Redirect href={`/invite/${encodeURIComponent(token)}`} />;
}
