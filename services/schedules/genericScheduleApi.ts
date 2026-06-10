import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';

const SCOPE = 'ScheduleAPI';

export type GenericScheduleCategory = 'feeding' | 'walk' | 'medicine' | 'grooming' | 'vaccination';

export interface GenericScheduleItem {
  _id: string;
  petId: string;
  category: GenericScheduleCategory | string;
  title?: string;
  description?: string;
  timeOfDay?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function fetchSchedules(
  token: string,
  petId: string,
  category?: GenericScheduleCategory,
): Promise<GenericScheduleItem[]> {
  const params = new URLSearchParams({ petId });
  if (category) params.set('category', category);
  log.info(SCOPE, 'GET /schedules', { petId, category });
  try {
    const data = await apiRequest<GenericScheduleItem[]>(
      `${API_ENDPOINTS.schedules.list}?${params.toString()}`,
      { token },
    );
    log.ok(SCOPE, 'Schedules loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List schedules failed', getErrorMessage(error));
    throw error;
  }
}

export async function createGenericSchedule(
  token: string,
  body: Record<string, unknown> & { petId: string; category: GenericScheduleCategory },
): Promise<GenericScheduleItem> {
  log.info(SCOPE, 'POST /schedules', { petId: body.petId, category: body.category });
  try {
    const data = await apiRequest<GenericScheduleItem>(API_ENDPOINTS.schedules.list, {
      method: 'POST',
      token,
      body,
    });
    log.ok(SCOPE, 'Schedule created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create schedule failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateGenericSchedule(
  token: string,
  id: string,
  body: Record<string, unknown>,
): Promise<GenericScheduleItem> {
  log.info(SCOPE, 'PUT /schedules/:id', { id });
  try {
    const data = await apiRequest<GenericScheduleItem>(`${API_ENDPOINTS.schedules.list}/${id}`, {
      method: 'PUT',
      token,
      body,
    });
    log.ok(SCOPE, 'Schedule updated', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update schedule failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteGenericSchedule(
  token: string,
  id: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /schedules/:id', { id });
  try {
    const data = await apiRequest<{ message: string }>(`${API_ENDPOINTS.schedules.list}/${id}`, {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Schedule deleted', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete schedule failed', getErrorMessage(error));
    throw error;
  }
}
