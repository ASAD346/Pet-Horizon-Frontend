import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiPet } from '@/types/pet';

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

function fileNameFromUri(uri: string): string {
  const segment = uri.split('/').pop();
  if (segment && segment.includes('.')) return segment;
  return `pet-${Date.now()}.jpg`;
}

export async function uploadPetImage(
  token: string,
  petId: string,
  localUri: string,
): Promise<ApiPet> {
  const path = API_ENDPOINTS.pets.image(petId);
  const url = `${API_BASE_URL}${path}`;

  log.info('PetAPI', 'POST /pets/:id/image', { petId });

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: fileNameFromUri(localUri),
    type: guessMimeType(localUri),
  } as unknown as Blob);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to upload pet photo';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // ignore parse error
    }
    log.fail('PetAPI', 'Pet image upload failed', { petId, status: response.status, message });
    throw new ApiError(message, response.status);
  }

  const pet = (await response.json()) as ApiPet;
  log.ok('PetAPI', 'Pet image uploaded', { petId: pet._id, image: pet.image });
  return pet;
}
