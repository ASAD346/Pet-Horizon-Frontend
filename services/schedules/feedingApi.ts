import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { CreateFeedingScheduleRequest, FeedingScheduleItem } from '@/types/feeding';
import type { PetPermissionsResponse } from '@/types/pet';

const SCOPE = 'FeedingAPI';

export async function fetchPetPermissions(
  token: string,
  petId: string,
): Promise<PetPermissionsResponse> {
  log.info(SCOPE, 'GET /pets/:id/permissions/me', { petId });
  try {
    const data = await apiRequest<PetPermissionsResponse>(
      API_ENDPOINTS.pets.permissionsMe(petId),
      { token },
    );
    log.ok(SCOPE, 'Permissions loaded', {
      mealTypes: data.speciesFeatures?.mealTypes?.length ?? 0,
    });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Permissions failed', getErrorMessage(error));
    throw error;
  }
}

export async function createFeedingSchedule(
  token: string,
  body: CreateFeedingScheduleRequest,
): Promise<FeedingScheduleItem> {
  log.info(SCOPE, 'POST /schedules/feeding', {
    petId: body.petId,
    mealType: body.mealType,
    time: body.time,
  });
  try {
    const data = await apiRequest<FeedingScheduleItem>(API_ENDPOINTS.schedules.feeding, {
      method: 'POST',
      token,
      body,
    });
    log.ok(SCOPE, 'Feeding schedule created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create feeding failed', getErrorMessage(error));
    throw error;
  }
}
