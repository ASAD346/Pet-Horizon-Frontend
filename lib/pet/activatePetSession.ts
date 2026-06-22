import { clearActivePetCache, setActivePetCache } from '@/lib/pet/activePetCache';
import { clearPetListCache } from '@/lib/pet/petListCache';
import { clearPetPermissionCache } from '@/lib/pet/petPermissionCache';
import { rememberSharedPetId } from '@/lib/pet/sharedPetIdsStorage';
import type { ApiUser } from '@/types/auth';
import type { ApiPet } from '@/types/pet';
import { fetchPetById, setActivePet } from '@/services/pets/petApi';

interface ActivatePetSessionParams {
  token: string;
  petId: string;
  user: ApiUser | null;
  setSession: (session: { token: string; user: ApiUser }) => Promise<void>;
}

/** Switch active pet, refresh local cache, and persist session after invite accept / switch. */
export async function activatePetSession({
  token,
  petId,
  user,
  setSession,
}: ActivatePetSessionParams): Promise<ApiPet> {
  clearActivePetCache();
  clearPetPermissionCache();
  clearPetListCache();
  await setActivePet(token, petId);
  const pet = await fetchPetById(token, petId);
  setActivePetCache(token, pet);

  if (user && pet.ownerUserId && pet.ownerUserId !== user._id) {
    await rememberSharedPetId(user._id, petId);
  }

  if (user) {
    await setSession({
      token,
      user: { ...user, activePetId: petId },
    });
  }

  return pet;
}
