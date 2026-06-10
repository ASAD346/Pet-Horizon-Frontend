import * as SecureStore from 'expo-secure-store';

const keyForUser = (userId: string) => `familyHubId:${userId}`;

export async function getStoredFamilyHubId(userId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(keyForUser(userId));
  } catch {
    return null;
  }
}

export async function setStoredFamilyHubId(userId: string, familyId: string): Promise<void> {
  await SecureStore.setItemAsync(keyForUser(userId), familyId);
}

export async function clearStoredFamilyHubId(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(keyForUser(userId));
}
