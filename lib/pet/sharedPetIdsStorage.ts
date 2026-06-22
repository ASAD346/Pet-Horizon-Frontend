import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'pet_horizon_shared_pet_ids:';

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export async function getStoredSharedPetIds(userId: string | undefined): Promise<string[]> {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function rememberSharedPetId(userId: string, petId: string): Promise<void> {
  const existing = await getStoredSharedPetIds(userId);
  if (existing.includes(petId)) return;
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify([...existing, petId]));
}

export async function forgetSharedPetId(userId: string, petId: string): Promise<void> {
  const existing = await getStoredSharedPetIds(userId);
  const next = existing.filter((id) => id !== petId);
  if (next.length === existing.length) return;
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
}
