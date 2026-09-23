import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { ApiError } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiPet } from '@/types/pet';
import { prepareImageForUpload } from '@/lib/uploadUtils';

export async function uploadPetImage(
  token: string,
  petId: string,
  localUri: string,
): Promise<ApiPet> {
  const path = API_ENDPOINTS.pets.image(petId);
  const url = `${API_BASE_URL}${path}`;

  log.info('PetAPI', 'POST /pets/:id/image', { petId });

  const formData = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const seg = localUri.split('/').pop() ?? `pet-${Date.now()}.jpg`;
    formData.append('file', blob, seg);
  } else {
    const file = await prepareImageForUpload(localUri, 'pet');
    log.info('PetAPI', 'Pet image prepared', { name: file.name, type: file.type, uri: file.uri.slice(0, 60) });
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }

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
