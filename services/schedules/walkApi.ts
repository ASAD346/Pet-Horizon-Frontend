import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  CompleteWalkRequest,
  CompleteWalkResponse,
  CreateWalkScheduleRequest,
  WalkScheduleItem,
} from '@/types/walk';

const SCOPE = 'WalkAPI';

export async function fetchTodayWalkSchedules(
  token: string,
  petId: string,
): Promise<WalkScheduleItem[]> {
  log.info(SCOPE, 'GET /schedules/today?category=walk', { petId });
  try {
    const data = await apiRequest<WalkScheduleItem[]>(
      `${API_ENDPOINTS.schedules.today}?petId=${encodeURIComponent(petId)}&category=walk`,
      { token },
    );
    if (!data.length) {
      log.warn(SCOPE, 'No walk schedules for pet today', { petId });
    } else {
      log.ok(SCOPE, 'Today walk schedules loaded', { count: data.length });
    }
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List today walks failed', getErrorMessage(error));
    throw error;
  }
}

export async function createWalkSchedule(
  token: string,
  body: CreateWalkScheduleRequest,
): Promise<WalkScheduleItem> {
  log.info(SCOPE, 'POST /schedules/walk', {
    petId: body.petId,
    walkTime: body.walkTime,
    time: body.time,
    duration: body.duration,
  });
  try {
    const data = await apiRequest<WalkScheduleItem>(API_ENDPOINTS.schedules.walk, {
      method: 'POST',
      token,
      body,
    });
    log.ok(SCOPE, 'Walk schedule created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create walk failed', getErrorMessage(error));
    throw error;
  }
}

export async function completeWalkSchedule(
  token: string,
  scheduleId: string,
  body: CompleteWalkRequest = { status: 'done' },
): Promise<CompleteWalkResponse> {
  log.info(SCOPE, 'POST /schedules/walk/:id/complete', { scheduleId, status: body.status });
  try {
    const data = await apiRequest<CompleteWalkResponse>(
      API_ENDPOINTS.schedules.walkComplete(scheduleId),
      { method: 'POST', token, body },
    );
    log.ok(SCOPE, 'Walk marked complete', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Complete walk failed', getErrorMessage(error));
    throw error;
  }
}
