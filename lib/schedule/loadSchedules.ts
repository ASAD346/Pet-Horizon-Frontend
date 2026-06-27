import { fetchGroomingRecords } from '@/services/grooming/groomingApi';
import { fetchFeedingSchedules } from '@/services/schedules/feedingApi';
import { fetchMedicineSchedules } from '@/services/schedules/medicineApi';
import { fetchVaccinationSchedules } from '@/services/schedules/vaccinationApi';
import { fetchWalkSchedules } from '@/services/schedules/walkApi';
import { buildScheduleSectionsState } from './mapSchedules';
import type { ScheduleSectionsState } from './types';

export async function loadExistingSchedules(
  token: string,
  petId: string,
  options: { groomingVisible?: boolean; disabledCategories?: string[] } = {},
): Promise<ScheduleSectionsState> {
  const [feeding, walk, medicine, vaccination, grooming] = await Promise.all([
    fetchFeedingSchedules(token, petId).catch(() => []),
    fetchWalkSchedules(token, petId).catch(() => []),
    fetchMedicineSchedules(token, petId).catch(() => []),
    fetchVaccinationSchedules(token, petId).catch(() => []),
    options.groomingVisible === false
      ? Promise.resolve([])
      : fetchGroomingRecords(token, petId).catch(() => []),
  ]);

  return buildScheduleSectionsState(
    { feeding, walk, medicine, vaccination, grooming },
    options.disabledCategories ?? [],
  );
}

