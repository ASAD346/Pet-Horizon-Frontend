import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  CompleteVaccinationRequest,
  CompleteVaccinationResponse,
  CreateVaccinationScheduleRequest,
  UpdateVaccinationScheduleRequest,
  VaccinationHistoryItem,
  VaccinationScheduleItem,
} from '@/types/vaccination';

const SCOPE = 'VaccinationAPI';

export async function fetchVaccinationSchedules(
  token: string,
  petId: string,
): Promise<VaccinationScheduleItem[]> {
  log.info(SCOPE, 'GET /schedules/vaccination', { petId });
  try {
    const data = await apiRequest<VaccinationScheduleItem[]>(
      `${API_ENDPOINTS.schedules.vaccination}?petId=${encodeURIComponent(petId)}`,
      { token },
    );
    if (!data.length) {
      log.warn(SCOPE, 'No vaccination schedules', { petId });
    } else {
      log.ok(SCOPE, 'Vaccination schedules loaded', { count: data.length });
    }
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List vaccination failed', getErrorMessage(error));
    throw error;
  }
}

export async function createVaccinationSchedule(
  token: string,
  body: CreateVaccinationScheduleRequest,
): Promise<VaccinationScheduleItem> {
  log.info(SCOPE, 'POST /schedules/vaccination', {
    petId: body.petId,
    vaccineName: body.vaccineName,
    dueDate: body.dueDate,
  });
  try {
    const data = await apiRequest<VaccinationScheduleItem>(API_ENDPOINTS.schedules.vaccination, {
      method: 'POST',
      token,
      body,
    });
    log.ok(SCOPE, 'Vaccination schedule created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create vaccination failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateVaccinationSchedule(
  token: string,
  id: string,
  body: UpdateVaccinationScheduleRequest,
): Promise<VaccinationScheduleItem> {
  log.info(SCOPE, 'PUT /schedules/vaccination/:id', { id });
  try {
    const data = await apiRequest<VaccinationScheduleItem>(
      API_ENDPOINTS.schedules.vaccinationById(id),
      { method: 'PUT', token, body },
    );
    log.ok(SCOPE, 'Vaccination schedule updated', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update vaccination failed', getErrorMessage(error));
    throw error;
  }
}

export async function completeVaccinationSchedule(
  token: string,
  scheduleId: string,
  body: CompleteVaccinationRequest = {},
): Promise<CompleteVaccinationResponse> {
  log.info(SCOPE, 'POST /schedules/vaccination/:id/complete', { scheduleId });
  try {
    const data = await apiRequest<CompleteVaccinationResponse>(
      API_ENDPOINTS.schedules.vaccinationComplete(scheduleId),
      { method: 'POST', token, body },
    );
    log.ok(SCOPE, 'Vaccination marked complete', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Complete vaccination failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteVaccinationSchedule(
  token: string,
  id: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /schedules/vaccination/:id', { id });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.schedules.vaccinationById(id), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Vaccination schedule deleted', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete vaccination failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchVaccinationHistory(
  token: string,
  petId: string,
): Promise<VaccinationHistoryItem[]> {
  log.info(SCOPE, 'GET /schedules/vaccination/history', { petId });
  try {
    const data = await apiRequest<VaccinationHistoryItem[]>(
      `${API_ENDPOINTS.schedules.vaccinationHistory}?petId=${encodeURIComponent(petId)}`,
      { token },
    );
    log.ok(SCOPE, 'Vaccination history loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load vaccination history failed', getErrorMessage(error));
    throw error;
  }
}
