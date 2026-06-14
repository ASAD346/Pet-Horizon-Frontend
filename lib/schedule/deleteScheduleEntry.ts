import { deleteGroomingRecord } from '@/services/grooming/groomingApi';
import { deleteFeedingSchedule } from '@/services/schedules/feedingApi';
import { deleteMedicineSchedule } from '@/services/schedules/medicineApi';
import { deleteVaccinationSchedule } from '@/services/schedules/vaccinationApi';
import { deleteWalkSchedule } from '@/services/schedules/walkApi';
import type { ScheduleSectionKey } from './types';

export async function deleteScheduleEntry(
  token: string,
  key: ScheduleSectionKey,
  remoteId: string,
): Promise<void> {
  switch (key) {
    case 'feeding':
      await deleteFeedingSchedule(token, remoteId);
      return;
    case 'walk':
      await deleteWalkSchedule(token, remoteId);
      return;
    case 'medicine':
      await deleteMedicineSchedule(token, remoteId);
      return;
    case 'vaccination':
      await deleteVaccinationSchedule(token, remoteId);
      return;
    case 'grooming':
      await deleteGroomingRecord(token, remoteId);
      return;
    default:
      throw new Error('Unknown schedule type.');
  }
}
