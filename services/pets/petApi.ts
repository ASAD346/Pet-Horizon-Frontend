import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  ActivePetIdResponse,
  ApiPet,
  BreedsListResponse,
  CreatePetRequest,
  SetActivePetResponse,
  SpeciesListResponse,
  UpdatePetRequest,
} from '@/types/pet';

const SCOPE = 'PetAPI';

export async function fetchSpecies(token: string): Promise<SpeciesListResponse> {
  log.info(SCOPE, 'GET /species');
  try {
    const data = await apiRequest<SpeciesListResponse>(API_ENDPOINTS.pets.species, { token });
    log.ok(SCOPE, 'Species loaded', { count: data.species?.length ?? 0 });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Species failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchBreeds(token: string, species: string): Promise<BreedsListResponse> {
  log.info(SCOPE, 'GET /breeds', { species });
  try {
    const query = `?species=${encodeURIComponent(species)}`;
    const data = await apiRequest<BreedsListResponse>(`${API_ENDPOINTS.pets.breeds}${query}`, { token });
    log.ok(SCOPE, 'Breeds loaded', { species, count: data.breeds?.length ?? 0 });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Breeds failed', { species, error: getErrorMessage(error) });
    throw error;
  }
}

export async function fetchActivePetId(token: string): Promise<ActivePetIdResponse> {
  log.info(SCOPE, 'GET /pets/active');
  try {
    const data = await apiRequest<ActivePetIdResponse>(API_ENDPOINTS.pets.active, { token });
    log.ok(SCOPE, 'Active pet id', { activePetId: data.activePetId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Active pet id failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchPetById(token: string, petId: string): Promise<ApiPet> {
  log.info(SCOPE, 'GET /pets/:id', { petId });
  try {
    const data = await apiRequest<ApiPet>(API_ENDPOINTS.pets.byId(petId), { token });
    log.ok(SCOPE, 'Pet loaded', { petId: data._id, name: data.name });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Pet load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function fetchPets(token: string): Promise<ApiPet[]> {
  log.info(SCOPE, 'GET /pets');
  try {
    const data = await apiRequest<ApiPet[]>(API_ENDPOINTS.pets.list, { token });
    log.ok(SCOPE, 'Pets loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List pets failed', getErrorMessage(error));
    throw error;
  }
}

export async function createPet(token: string, payload: CreatePetRequest): Promise<ApiPet> {
  log.info(SCOPE, 'POST /pets', { name: payload.name, species: payload.species, breed: payload.breed });
  try {
    const pet = await apiRequest<ApiPet>(API_ENDPOINTS.pets.create, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Pet created', { petId: pet._id, name: pet.name });
    return pet;
  } catch (error) {
    log.fail(SCOPE, 'Create pet failed', getErrorMessage(error));
    throw error;
  }
}

export async function setActivePet(token: string, petId: string): Promise<SetActivePetResponse> {
  log.info(SCOPE, 'PUT /pets/active/:id', { petId });
  try {
    const data = await apiRequest<SetActivePetResponse>(API_ENDPOINTS.pets.setActive(petId), {
      method: 'PUT',
      token,
    });
    log.ok(SCOPE, 'Active pet set', { activePetId: data.activePetId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Set active pet failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function updatePet(
  token: string,
  petId: string,
  payload: UpdatePetRequest,
): Promise<ApiPet> {
  log.info(SCOPE, 'PUT /pets/:id', { petId });
  try {
    const data = await apiRequest<ApiPet>(API_ENDPOINTS.pets.byId(petId), {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Pet updated', { petId: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update pet failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function deletePet(
  token: string,
  petId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /pets/:id', { petId });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.pets.byId(petId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Pet deleted', { petId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete pet failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

/** Create pet and set as active — used by register / add-pet screen */
export async function createAndActivatePet(
  token: string,
  payload: CreatePetRequest,
): Promise<ApiPet> {
  log.info(SCOPE, 'Add pet flow started', { name: payload.name });
  const pet = await createPet(token, payload);
  await setActivePet(token, pet._id);
  log.ok(SCOPE, 'Add pet flow complete', { petId: pet._id });
  return pet;
}
