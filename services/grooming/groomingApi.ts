import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  CompleteGroomingResponse,
  CreateGroomingRequest,
  GroomingRecord,
  GroomingTypesResponse,
  UpdateGroomingRequest,
} from '@/types/grooming';

const SCOPE = 'GroomingAPI';

export async function fetchGroomingTypes(
  token: string,
  petId: string,
): Promise<GroomingTypesResponse> {
  log.info(SCOPE, 'GET /grooming/types', { petId });
  try {
    const data = await apiRequest<GroomingTypesResponse>(
      `${API_ENDPOINTS.grooming.types}?petId=${encodeURIComponent(petId)}`,
      { token },
    );
    log.ok(SCOPE, 'Grooming types loaded', { count: data.types?.length ?? 0 });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load grooming types failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchUpcomingGrooming(token: string): Promise<GroomingRecord[]> {
  log.info(SCOPE, 'GET /grooming/upcoming');
  try {
    const data = await apiRequest<GroomingRecord[]>(API_ENDPOINTS.grooming.upcoming, { token });
    log.ok(SCOPE, 'Upcoming grooming loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load upcoming grooming failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchGroomingRecords(
  token: string,
  petId: string,
  status?: 'upcoming' | 'completed',
): Promise<GroomingRecord[]> {
  const statusQuery = status ? `&status=${encodeURIComponent(status)}` : '';
  log.info(SCOPE, 'GET /grooming', { petId, status });
  try {
    const data = await apiRequest<GroomingRecord[]>(
      `${API_ENDPOINTS.grooming.list}?petId=${encodeURIComponent(petId)}${statusQuery}`,
      { token },
    );
    if (!data.length) {
      log.warn(SCOPE, 'No grooming records', { petId, status });
    } else {
      log.ok(SCOPE, 'Grooming records loaded', { count: data.length });
    }
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List grooming failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchGroomingAlerts(
  token: string,
  options: { petId?: string; withinDays?: number } = {},
): Promise<GroomingRecord[]> {
  const params = new URLSearchParams();
  if (options.petId) params.set('petId', options.petId);
  if (options.withinDays !== undefined) params.set('withinDays', String(options.withinDays));
  const query = params.toString();
  log.info(SCOPE, 'GET /grooming/alerts', options);
  try {
    const data = await apiRequest<GroomingRecord[]>(
      `${API_ENDPOINTS.grooming.alerts}${query ? `?${query}` : ''}`,
      { token },
    );
    log.ok(SCOPE, 'Grooming alerts loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load grooming alerts failed', getErrorMessage(error));
    throw error;
  }
}

export async function createGroomingRecord(
  token: string,
  body: CreateGroomingRequest,
): Promise<GroomingRecord> {
  log.info(SCOPE, 'POST /grooming', {
    petId: body.petId,
    type: body.type,
    scheduledDate: body.scheduledDate,
  });
  try {
    const data = await apiRequest<GroomingRecord>(API_ENDPOINTS.grooming.create, {
      method: 'POST',
      token,
      body,
    });
    log.ok(SCOPE, 'Grooming record created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create grooming failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateGroomingRecord(
  token: string,
  id: string,
  body: UpdateGroomingRequest,
): Promise<GroomingRecord> {
  log.info(SCOPE, 'PUT /grooming/:id', { id });
  try {
    const data = await apiRequest<GroomingRecord>(API_ENDPOINTS.grooming.byId(id), {
      method: 'PUT',
      token,
      body,
    });
    log.ok(SCOPE, 'Grooming record updated', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update grooming failed', getErrorMessage(error));
    throw error;
  }
}

export async function completeGroomingRecord(
  token: string,
  id: string,
): Promise<CompleteGroomingResponse> {
  log.info(SCOPE, 'POST /grooming/:id/complete', { id });
  try {
    const data = await apiRequest<CompleteGroomingResponse>(API_ENDPOINTS.grooming.complete(id), {
      method: 'POST',
      token,
    });
    log.ok(SCOPE, 'Grooming marked complete', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Complete grooming failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteGroomingRecord(token: string, id: string): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /grooming/:id', { id });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.grooming.byId(id), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Grooming record deleted', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete grooming failed', getErrorMessage(error));
    throw error;
  }
}
