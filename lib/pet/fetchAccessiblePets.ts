import { log } from '@/lib/log';
import { getStoredSharedPetIds } from '@/lib/pet/sharedPetIdsStorage';
import { fetchActivePetId, fetchPetById, fetchPets } from '@/services/pets/petApi';
import type { ApiPet } from '@/types/pet';

function mergeUniquePets(pets: ApiPet[]): ApiPet[] {
  const map = new Map<string, ApiPet>();
  for (const pet of pets) {
    if (pet?._id) map.set(pet._id, pet);
  }
  return Array.from(map.values());
}

async function fetchPetsByIds(token: string, petIds: string[]): Promise<ApiPet[]> {
  if (!petIds.length) return [];

  const results = await Promise.all(
    petIds.map((petId) =>
      fetchPetById(token, petId).catch(() => null),
    ),
  );

  return results.filter((pet): pet is ApiPet => pet !== null);
}

/** Pets the user owns plus every shared pet they can access. */
export async function fetchAccessiblePets(
  token: string,
  userId?: string,
): Promise<ApiPet[]> {
  const [listed, activeResult, storedIds] = await Promise.all([
    fetchPets(token),
    fetchActivePetId(token).catch(() => ({ activePetId: null as string | null })),
    getStoredSharedPetIds(userId),
  ]);

  let pets = mergeUniquePets(listed);

  const ensureIds = new Set<string>();
  if (activeResult.activePetId) ensureIds.add(activeResult.activePetId);
  storedIds.forEach((id) => ensureIds.add(id));

  const missingIds = [...ensureIds].filter((id) => !pets.some((pet) => pet._id === id));
  if (missingIds.length) {
    const extras = await fetchPetsByIds(token, missingIds);
    if (extras.length) {
      pets = mergeUniquePets([...pets, ...extras]);
      log.info('Pets', 'Merged shared pets into list', { count: extras.length });
    }
  }

  return pets;
}
