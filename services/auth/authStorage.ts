import * as SecureStore from 'expo-secure-store';
import type { ApiUser, AuthSession } from '@/types/auth';

const TOKEN_KEY = 'pet_horizon_auth_token';
const USER_KEY = 'pet_horizon_auth_user';

export async function saveSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
}

export async function loadSession(): Promise<AuthSession | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userJson = await SecureStore.getItemAsync(USER_KEY);

  if (!token || !userJson) {
    return null;
  }

  try {
    const user = JSON.parse(userJson) as ApiUser;
    return { token, user };
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
