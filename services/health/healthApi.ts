import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { CreateHealthRequest, HealthMetric, UpdateHealthRequest } from '@/types/health';

const SCOPE = 'HealthAPI';

export async function fetchHealthMetrics(
  token: string,
  petId: string,
  from?: string,
  to?: string,
): Promise<HealthMetric[]> {
  const params = new URLSearchParams({ petId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  log.info(SCOPE, 'GET /health', { petId, from, to });
  try {
    const data = await apiRequest<HealthMetric[]>(`${API_ENDPOINTS.health.list}?${params.toString()}`, {
      token,
    });
    log.ok(SCOPE, 'Health metrics loaded', { petId, count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Health load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function createHealthMetric(
  token: string,
  payload: CreateHealthRequest,
): Promise<HealthMetric> {
  log.info(SCOPE, 'POST /health', { petId: payload.petId });
  try {
    const data = await apiRequest<HealthMetric>(API_ENDPOINTS.health.list, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Health metric created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create health failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateHealthMetric(
  token: string,
  id: string,
  payload: UpdateHealthRequest,
): Promise<HealthMetric> {
  log.info(SCOPE, 'PUT /health/:id', { id });
  try {
    const data = await apiRequest<HealthMetric>(API_ENDPOINTS.health.byId(id), {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Health metric updated', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update health failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteHealthMetric(token: string, id: string): Promise<void> {
  log.info(SCOPE, 'DELETE /health/:id', { id });
  try {
    await apiRequest(API_ENDPOINTS.health.byId(id), { method: 'DELETE', token });
    log.ok(SCOPE, 'Health metric deleted', { id });
  } catch (error) {
    log.fail(SCOPE, 'Delete health failed', getErrorMessage(error));
    throw error;
  }
}
