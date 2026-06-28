import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { log } from '@/lib/log';
import type { ApiUser, AuthSession } from '@/types/auth';

const TOKEN_KEY = 'pet_horizon_auth_token';
const USER_KEY = 'pet_horizon_auth_user';
const STORAGE_BACKEND_KEY = 'pet_horizon_auth_backend';

type StorageBackend = 'secure' | 'async';

async function markBackend(backend: StorageBackend): Promise<void> {
  await AsyncStorage.setItem(STORAGE_BACKEND_KEY, backend);
}

async function getBackend(): Promise<StorageBackend> {
  const value = await AsyncStorage.getItem(STORAGE_BACKEND_KEY);
  return value === 'async' ? 'async' : 'secure';
}

async function writeItem(key: string, value: string): Promise<void> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value);
      await markBackend('secure');
      return;
    }
  } catch (error) {
    log.warn('AuthStorage', 'SecureStore write failed — using AsyncStorage', {
      key,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  await AsyncStorage.setItem(key, value);
  await markBackend('async');
}

async function readItem(key: string): Promise<string | null> {
  const backend = await getBackend();

  if (backend === 'async') {
    return AsyncStorage.getItem(key);
  }

  try {
    if (await SecureStore.isAvailableAsync()) {
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue) return secureValue;
    }
  } catch (error) {
    log.warn('AuthStorage', 'SecureStore read failed — trying AsyncStorage', {
      key,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return AsyncStorage.getItem(key);
}

async function deleteItem(key: string): Promise<void> {
  const isSecureAvailable = await SecureStore.isAvailableAsync();
  if (isSecureAvailable) {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(key),
      AsyncStorage.removeItem(key),
    ]);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  await writeItem(TOKEN_KEY, session.token);
  await writeItem(USER_KEY, JSON.stringify(session.user));
}

export async function loadSession(): Promise<AuthSession | null> {
  const token = await readItem(TOKEN_KEY);
  const userJson = await readItem(USER_KEY);

  if (!token || !userJson) {
    return null;
  }

  try {
    const user = JSON.parse(userJson) as ApiUser;
    if (!user?._id || !user.email) {
      throw new Error('Stored user is incomplete');
    }
    return { token, user };
  } catch (error) {
    log.fail('AuthStorage', 'Invalid stored session — clearing', {
      message: error instanceof Error ? error.message : String(error),
    });
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteItem(TOKEN_KEY),
    deleteItem(USER_KEY),
    AsyncStorage.removeItem(STORAGE_BACKEND_KEY),
    AsyncStorage.removeItem('userToken'),
    AsyncStorage.removeItem('authSession'),
    AsyncStorage.removeItem('currentUserId'),
    AsyncStorage.removeItem('pet_horizon_cached_active_pet'),
    AsyncStorage.removeItem('pet_horizon_cached_pet_permissions'),
  ]);

  try {
    await AsyncStorage.setItem('HAS_SEEN_ONBOARDING', 'true');
  } catch (error) {
    log.warn('AuthStorage', 'Failed to force HAS_SEEN_ONBOARDING on clearSession', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getStoredToken(): Promise<string | null> {
  return readItem(TOKEN_KEY);
}
