import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  CompleteMedicineRequest,
  CompleteMedicineResponse,
  CreateMedicineScheduleRequest,
  MedicineScheduleItem,
} from '@/types/medicine';

const SCOPE = 'MedicineAPI';

type CreateMedicineResponse =
  | MedicineScheduleItem
  | { created: MedicineScheduleItem[]; count: number };

function unwrapCreateResponse(data: CreateMedicineResponse): MedicineScheduleItem {
  if ('created' in data && Array.isArray(data.created)) {
    return data.created[0];
  }
  return data as MedicineScheduleItem;
}

export async function fetchTodayMedicineSchedules(
  token: string,
  petId: string,
): Promise<MedicineScheduleItem[]> {
  log.info(SCOPE, 'GET /schedules/today?category=medicine', { petId });
  try {
    const data = await apiRequest<MedicineScheduleItem[]>(
      `${API_ENDPOINTS.schedules.today}?petId=${encodeURIComponent(petId)}&category=medicine`,
      { token },
    );
    if (!data.length) {
      log.warn(SCOPE, 'No medicine schedules for pet today', { petId });
    } else {
      log.ok(SCOPE, 'Today medicine schedules loaded', { count: data.length });
    }
    return data;
  } catch (error) {
    log.fail(SCOPE, 'List today medicine failed', getErrorMessage(error));
    throw error;
  }
}

export async function createMedicineSchedule(
  token: string,
  body: CreateMedicineScheduleRequest,
): Promise<MedicineScheduleItem> {
  log.info(SCOPE, 'POST /schedules/medicine', {
    petId: body.petId,
    medicineName: body.medicineName,
    dose: body.dose,
    time: body.time,
    frequency: body.frequency,
  });
  try {
    const data = await apiRequest<CreateMedicineResponse>(API_ENDPOINTS.schedules.medicine, {
      method: 'POST',
      token,
      body,
    });
    const created = unwrapCreateResponse(data);
    log.ok(SCOPE, 'Medicine schedule created', { id: created._id });
    return created;
  } catch (error) {
    log.fail(SCOPE, 'Create medicine failed', getErrorMessage(error));
    throw error;
  }
}

export async function completeMedicineSchedule(
  token: string,
  scheduleId: string,
  body: CompleteMedicineRequest = { status: 'done' },
): Promise<CompleteMedicineResponse> {
  log.info(SCOPE, 'POST /schedules/medicine/:id/complete', { scheduleId, status: body.status });
  try {
    const data = await apiRequest<CompleteMedicineResponse>(
      API_ENDPOINTS.schedules.medicineComplete(scheduleId),
      { method: 'POST', token, body },
    );
    log.ok(SCOPE, 'Medicine marked complete', { scheduleId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Complete medicine failed', getErrorMessage(error));
    throw error;
  }
}
