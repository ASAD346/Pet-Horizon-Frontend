import { setActivePetCache } from '@/lib/pet/activePetCache';
import { rememberSharedPetId } from '@/lib/pet/sharedPetIdsStorage';
import type { ApiUser } from '@/types/auth';
import type { ApiPet } from '@/types/pet';
import { fetchPetById, setActivePet } from '@/services/pets/petApi';
import { store } from '@/redux/store';
import { setActivePetAction } from '@/redux/reducer';

interface ActivatePetSessionParams {
  token: string;
  petId: string;
  user: ApiUser | null;
  setSession: (session: { token: string; user: ApiUser }) => Promise<void>;
  nextPet?: ApiPet | null;
}

/** Switch active pet, refresh local cache, and persist session after invite accept / switch. */
export async function activatePetSession({
  token,
  petId,
  user,
  setSession,
  nextPet,
}: ActivatePetSessionParams): Promise<ApiPet> {
  // 1. Optimistically update Redux & cache immediately if nextPet is known
  if (nextPet && nextPet._id === petId) {
    setActivePetCache(token, nextPet);
    store.dispatch(setActivePetAction(nextPet));
  }

  // 2. Persist active pet ID to backend
  await setActivePet(token, petId);

  // 3. Fetch latest full pet record from backend if not already provided
  const pet = nextPet && nextPet._id === petId ? nextPet : await fetchPetById(token, petId);
  setActivePetCache(token, pet);
  store.dispatch(setActivePetAction(pet));

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
