import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  CompleteFeedingRequest,
  CompleteFeedingResponse,
  CreateFeedingScheduleRequest,
  FeedingScheduleItem,
} from '@/types/feeding';
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
      inventoryUnits: data.speciesFeatures?.inventoryUnits?.length ?? 0,
    });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Permissions failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchFeedingSchedules(
  token: string,
  petId: string,
): Promise<FeedingScheduleItem[]> {
  log.info(SCOPE, 'GET /schedules/feeding', { petId });
  try {
    const data = await apiRequest<FeedingScheduleItem[]>(
      `${API_ENDPOINTS.schedules.feeding}?petId=${encodeURIComponent(petId)}`,
      { token },
    );
    if (!data.length) {
      log.warn(SCOPE, 'No feeding schedules for pet', { petId });
    } else {
      log.ok(SCOPE, 'Feeding schedules loaded', { count: data.length });
    }
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List feeding failed', getErrorMessage(error));
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
    reminderMinutes: body.reminderMinutes,
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

export async function completeFeedingSchedule(
  token: string,
  scheduleId: string,
  body: CompleteFeedingRequest = { status: 'done' },
): Promise<CompleteFeedingResponse> {
  log.info(SCOPE, 'POST /schedules/feeding/:id/complete', { scheduleId, status: body.status });
  try {
    const data = await apiRequest<CompleteFeedingResponse>(
      API_ENDPOINTS.schedules.feedingComplete(scheduleId),
      { method: 'POST', token, body },
    );
    log.ok(SCOPE, 'Feeding marked complete', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Complete feeding failed', getErrorMessage(error));
    throw error;
  }
}

export async function skipFeedingSchedule(
  token: string,
  scheduleId: string,
): Promise<CompleteFeedingResponse> {
  log.info(SCOPE, 'PUT /schedules/feeding/:id/skip', { scheduleId });
  try {
    const data = await apiRequest<CompleteFeedingResponse>(
      API_ENDPOINTS.schedules.feedingSkip(scheduleId),
      { method: 'PUT', token },
    );
    log.ok(SCOPE, 'Feeding skipped', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Skip feeding failed', getErrorMessage(error));
    throw error;
  }
}
