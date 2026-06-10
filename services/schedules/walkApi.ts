import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  CompleteWalkRequest,
  CompleteWalkResponse,
  CreateWalkScheduleRequest,
  RescheduleWalkRequest,
  UpdateWalkScheduleRequest,
  WalkScheduleItem,
  WalkStatsResponse,
} from '@/types/walk';

const SCOPE = 'WalkAPI';

export async function fetchWalkSchedules(token: string, petId: string): Promise<WalkScheduleItem[]> {
  log.info(SCOPE, 'GET /schedules/walk', { petId });
  try {
    const data = await apiRequest<WalkScheduleItem[]>(
      `${API_ENDPOINTS.schedules.walkList}?petId=${encodeURIComponent(petId)}`,
      { token },
    );
    log.ok(SCOPE, 'Walk schedules loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List walks failed', getErrorMessage(error));
    throw error;
  }
}

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

export async function updateWalkSchedule(
  token: string,
  scheduleId: string,
  body: UpdateWalkScheduleRequest,
): Promise<WalkScheduleItem> {
  log.info(SCOPE, 'PUT /schedules/walk/:id', { scheduleId });
  try {
    const data = await apiRequest<WalkScheduleItem>(API_ENDPOINTS.schedules.walkById(scheduleId), {
      method: 'PUT',
      token,
      body,
    });
    log.ok(SCOPE, 'Walk schedule updated', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update walk failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteWalkSchedule(
  token: string,
  scheduleId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /schedules/walk/:id', { scheduleId });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.schedules.walkById(scheduleId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Walk schedule deleted', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete walk failed', getErrorMessage(error));
    throw error;
  }
}

export async function rescheduleWalkSchedule(
  token: string,
  scheduleId: string,
  body: RescheduleWalkRequest,
): Promise<WalkScheduleItem> {
  log.info(SCOPE, 'POST /schedules/walk/:id/reschedule', { scheduleId, newTime: body.newTime });
  try {
    const data = await apiRequest<WalkScheduleItem>(API_ENDPOINTS.schedules.walkReschedule(scheduleId), {
      method: 'POST',
      token,
      body,
    });
    log.ok(SCOPE, 'Walk rescheduled', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Reschedule walk failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchWalkStats(
  token: string,
  petId: string,
  from?: string,
  to?: string,
): Promise<WalkStatsResponse> {
  const params = new URLSearchParams({ petId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  log.info(SCOPE, 'GET /schedules/walk/stats', { petId, from, to });
  try {
    const data = await apiRequest<WalkStatsResponse>(
      `${API_ENDPOINTS.schedules.walkStats}?${params.toString()}`,
      { token },
    );
    log.ok(SCOPE, 'Walk stats loaded', { petId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Walk stats failed', getErrorMessage(error));
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
