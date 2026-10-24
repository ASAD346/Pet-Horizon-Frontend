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

import { getTimezoneQueryParams, getLocalDateString, getDeviceTimezone } from '@/lib/timezone';

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
  const timezone = getDeviceTimezone();
  const payload = {
    timezone,
    ...body,
  };
  try {
    const data = await apiRequest<WalkScheduleItem>(API_ENDPOINTS.schedules.walk, {
      method: 'POST',
      token,
      body: payload,
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
  const localDate = body.date || getLocalDateString();
  const query = getTimezoneQueryParams(localDate);
  const payload: CompleteWalkRequest = {
    status: body.status || 'done',
    date: localDate,
    completedAt: body.completedAt || new Date().toISOString(),
    ...body,
  };
  try {
    const data = await apiRequest<CompleteWalkResponse>(
      `${API_ENDPOINTS.schedules.walkComplete(scheduleId)}${query}`,
      { method: 'POST', token, body: payload },
    );
    log.ok(SCOPE, 'Walk marked complete', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Complete walk failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchWalkSchedules(
  token: string,
  petId: string,
): Promise<WalkScheduleItem[]> {
  log.info(SCOPE, 'GET /schedules/walk', { petId });
  try {
    const data = await apiRequest<WalkScheduleItem[]>(
      `${API_ENDPOINTS.schedules.walk}?petId=${encodeURIComponent(petId)}`,
      { token },
    );
    log.ok(SCOPE, 'Walk schedules loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List walks failed', getErrorMessage(error));
    throw error;
  }
}

export interface UpdateWalkScheduleRequest {
  time?: string;
  duration?: number;
  notes?: string;
  reminder?: boolean;
  reminderMinutes?: number;
  reminderTime?: string;
  date?: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
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

export async function startWalkSession(
  token: string,
  scheduleId: string,
): Promise<{ success: boolean; activeSession: { userId: string; userName: string; startedAt: number } }> {
  log.info(SCOPE, 'PATCH /schedules/walk/:id/start', { scheduleId });
  try {
    const data = await apiRequest<{ success: boolean; activeSession: { userId: string; userName: string; startedAt: number } }>(
      API_ENDPOINTS.schedules.walkStart(scheduleId),
      { method: 'PATCH', token },
    );
    log.ok(SCOPE, 'Walk session started on backend', { scheduleId });
    return data;
  } catch (error) {
    // Non-fatal: local timer still works even if backend call fails
    log.fail(SCOPE, 'Start walk session backend sync failed', getErrorMessage(error));
    throw error;
  }
}

export async function cancelWalkSession(
  token: string,
  scheduleId: string,
): Promise<{ success: boolean }> {
  log.info(SCOPE, 'POST /schedules/walk/:id/cancel-session', { scheduleId });
  try {
    const data = await apiRequest<{ success: boolean }>(
      `${API_ENDPOINTS.schedules.walk}/${scheduleId}/cancel-session`,
      { method: 'POST', token },
    );
    log.ok(SCOPE, 'Walk session cancelled on backend', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Cancel walk session backend sync failed', getErrorMessage(error));
    throw error;
  }
}

export async function reopenWalkSchedule(
  token: string,
  scheduleId: string,
  date?: string,
): Promise<{ success: boolean; scheduleItem?: any }> {
  log.info(SCOPE, 'POST /schedules/walk/:id/reopen', { scheduleId });
  const localDate = date || getLocalDateString();
  const query = getTimezoneQueryParams(localDate);
  const payload = {
    date: localDate,
    status: 'pending',
  };
  try {
    const data = await apiRequest<{ success: boolean; scheduleItem?: any }>(
      `${API_ENDPOINTS.schedules.walk}/${scheduleId}/reopen${query}`,
      { method: 'POST', token, body: payload },
    );
    log.ok(SCOPE, 'Walk schedule reopened', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Reopen walk failed', getErrorMessage(error));
    throw error;
  }
}
