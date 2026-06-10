import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { CreateMedicalRequest, MedicalRecord, UpdateMedicalRequest } from '@/types/medical';

const SCOPE = 'MedicalAPI';

export async function fetchMedicalRecords(token: string, petId: string): Promise<MedicalRecord[]> {
  log.info(SCOPE, 'GET /medical', { petId });
  try {
    const data = await apiRequest<MedicalRecord[]>(
      `${API_ENDPOINTS.medical.list}?petId=${encodeURIComponent(petId)}`,
      { token },
    );
    log.ok(SCOPE, 'Medical records loaded', { petId, count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Medical load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function createMedicalRecord(
  token: string,
  payload: CreateMedicalRequest,
): Promise<MedicalRecord> {
  log.info(SCOPE, 'POST /medical', { petId: payload.petId });
  try {
    const data = await apiRequest<MedicalRecord>(API_ENDPOINTS.medical.list, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Medical record created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create medical failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateMedicalRecord(
  token: string,
  id: string,
  payload: UpdateMedicalRequest,
): Promise<MedicalRecord> {
  log.info(SCOPE, 'PUT /medical/:id', { id });
  try {
    const data = await apiRequest<MedicalRecord>(API_ENDPOINTS.medical.byId(id), {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Medical record updated', { id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update medical failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteMedicalRecord(token: string, id: string): Promise<void> {
  log.info(SCOPE, 'DELETE /medical/:id', { id });
  try {
    await apiRequest(API_ENDPOINTS.medical.byId(id), { method: 'DELETE', token });
    log.ok(SCOPE, 'Medical record deleted', { id });
  } catch (error) {
    log.fail(SCOPE, 'Delete medical failed', getErrorMessage(error));
    throw error;
  }
}
