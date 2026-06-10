import { deleteGroomingRecord } from '@/services/grooming/groomingApi';
import { deleteFeedingSchedule } from '@/services/schedules/feedingApi';
import { deleteMedicineSchedule } from '@/services/schedules/medicineApi';
import { deleteVaccinationSchedule } from '@/services/schedules/vaccinationApi';
import { deleteWalkSchedule } from '@/services/schedules/walkApi';
import type { ScheduleSectionKey } from '@/lib/schedule/types';

export async function deleteScheduleEntryByKey(
  token: string,
  key: ScheduleSectionKey,
  remoteId: string,
): Promise<void> {
  switch (key) {
    case 'feeding':
      await deleteFeedingSchedule(token, remoteId);
      break;
    case 'walk':
      await deleteWalkSchedule(token, remoteId);
      break;
    case 'medicine':
      await deleteMedicineSchedule(token, remoteId);
      break;
    case 'vaccination':
      await deleteVaccinationSchedule(token, remoteId);
      break;
    case 'grooming':
      await deleteGroomingRecord(token, remoteId);
      break;
    default:
      break;
  }
}
