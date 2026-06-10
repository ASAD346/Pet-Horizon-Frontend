import {
  addMinutesToTimeHHmm,
  dateToTimeHHmm,
} from '@/lib/feeding/feedingForm';
import { dateToApiDateString } from '@/lib/grooming/groomingForm';
import {
  buildDoseString,
  isStartBeforeOrEqualEnd,
  parseTotalPills,
} from '@/lib/medicine/medicineForm';
import type { ScheduleSectionsState } from '@/lib/schedule/types';
import { createGroomingRecord, updateGroomingRecord } from '@/services/grooming/groomingApi';
import {
  createFeedingSchedule,
  updateFeedingSchedule,
} from '@/services/schedules/feedingApi';
import {
  createMedicineSchedule,
  updateMedicineSchedule,
} from '@/services/schedules/medicineApi';
import {
  createVaccinationSchedule,
  updateVaccinationSchedule,
} from '@/services/schedules/vaccinationApi';
import { createWalkSchedule, updateWalkSchedule } from '@/services/schedules/walkApi';
import { parseDurationMinutes } from '@/lib/walk/walkForm';

export interface SaveSchedulesResult {
  savedCount: number;
  errors: string[];
}

function pushError(errors: string[], label: string, message: string) {
  errors.push(`${label}: ${message}`);
}

export async function saveAllSchedules(
  token: string,
  petId: string,
  sections: ScheduleSectionsState,
  options: { groomingVisible?: boolean } = {},
): Promise<SaveSchedulesResult> {
  const errors: string[] = [];
  let savedCount = 0;

  if (sections.feeding.enabled) {
    for (let i = 0; i < sections.feeding.entries.length; i += 1) {
      const entry = sections.feeding.entries[i];
      const label = `Feeding ${i + 1}`;
      if (!entry.mealType) {
        pushError(errors, label, 'Select a meal type.');
        continue;
      }
      if (!entry.unit) {
        pushError(errors, label, 'Select a unit.');
        continue;
      }
      if (!entry.amount.trim()) {
        pushError(errors, label, 'Enter an amount.');
        continue;
      }
      const timeHHmm = dateToTimeHHmm(entry.feedingTime);
      const noteText = entry.notes.trim();
      const payload = {
        mealType: entry.mealType,
        time: timeHHmm,
        amount: entry.amount.trim(),
        unit: entry.unit,
        notes: noteText || undefined,
        reminder: entry.notificationsOn,
        reminderMinutes: entry.notificationsOn ? entry.reminderMinutes : undefined,
        reminderTime: entry.notificationsOn
          ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
          : undefined,
      };
      try {
        if (entry.scheduleId) {
          await updateFeedingSchedule(token, entry.scheduleId, payload);
        } else {
          await createFeedingSchedule(token, { petId, ...payload });
        }
        savedCount += 1;
      } catch (e) {
        pushError(errors, label, e instanceof Error ? e.message : 'Save failed.');
      }
    }
  }

  if (sections.walk.enabled) {
    for (let i = 0; i < sections.walk.entries.length; i += 1) {
      const entry = sections.walk.entries[i];
      const label = `Walk ${i + 1}`;
      const durationMinutes = parseDurationMinutes(entry.duration);
      if (!durationMinutes) {
        pushError(errors, label, 'Enter a valid duration in minutes.');
        continue;
      }
      const timeHHmm = dateToTimeHHmm(entry.walkClockTime);
      const noteText = entry.notes.trim();
      const payload = {
        time: timeHHmm,
        duration: durationMinutes,
        notes: noteText || undefined,
        reminder: entry.notificationsOn,
        reminderMinutes: entry.notificationsOn ? entry.reminderMinutes : undefined,
        reminderTime: entry.notificationsOn
          ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
          : undefined,
      };
      try {
        if (entry.scheduleId) {
          await updateWalkSchedule(token, entry.scheduleId, payload);
        } else {
          await createWalkSchedule(token, {
            petId,
            walkTime: entry.walkTime,
            ...payload,
          });
        }
        savedCount += 1;
      } catch (e) {
        pushError(errors, label, e instanceof Error ? e.message : 'Save failed.');
      }
    }
  }

  if (sections.medicine.enabled) {
    for (let i = 0; i < sections.medicine.entries.length; i += 1) {
      const entry = sections.medicine.entries[i];
      const label = `Medicine ${i + 1}`;
      const name = entry.medicineName.trim();
      if (!name) {
        pushError(errors, label, 'Enter a medicine name.');
        continue;
      }
      const dose = buildDoseString(entry.doseAmount, entry.doseForm);
      if (!dose) {
        pushError(errors, label, 'Enter a valid dose amount.');
        continue;
      }
      if (entry.frequency === 'weekly' && entry.daysOfWeek.length === 0) {
        pushError(errors, label, 'Select at least one day for a weekly schedule.');
        continue;
      }
      if (entry.startDate && entry.endDate && !isStartBeforeOrEqualEnd(entry.startDate, entry.endDate)) {
        pushError(errors, label, 'Start date must be before or equal to end date.');
        continue;
      }
      const pills = parseTotalPills(entry.totalPills);
      if (pills === null) {
        pushError(errors, label, 'Enter a valid total quantity.');
        continue;
      }
      const timeHHmm = dateToTimeHHmm(entry.medicineTime);
      const noteText = entry.notes.trim();
      const lowThreshold = entry.lowStockThreshold
        ? parseInt(entry.lowStockThreshold, 10)
        : undefined;
      try {
        if (entry.scheduleId) {
          await updateMedicineSchedule(token, entry.scheduleId, {
            dose,
            time: timeHHmm,
            doseForm: entry.doseForm,
            remainingPills: entry.remainingPills
              ? parseInt(entry.remainingPills, 10)
              : undefined,
            lowStockThreshold: lowThreshold,
            startDate: entry.startDate ? dateToApiDateString(entry.startDate) : undefined,
            endDate: entry.endDate ? dateToApiDateString(entry.endDate) : undefined,
            notes: noteText || undefined,
            reminder: entry.reminderOn,
            reminderMinutes: entry.reminderOn ? entry.reminderMinutes : undefined,
            reminderTime: entry.reminderOn
              ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
              : undefined,
          });
        } else {
          await createMedicineSchedule(token, {
            petId,
            medicineName: name,
            dose,
            time: timeHHmm,
            doseForm: entry.doseForm,
            frequency: entry.frequency,
            daysOfWeek: entry.frequency === 'weekly' ? entry.daysOfWeek : undefined,
            totalPills: pills,
            remainingPills: pills,
            lowStockThreshold: lowThreshold,
            notes: noteText || undefined,
            startDate: entry.startDate ? dateToApiDateString(entry.startDate) : undefined,
            endDate: entry.endDate ? dateToApiDateString(entry.endDate) : undefined,
            reminder: entry.reminderOn,
            reminderMinutes: entry.reminderOn ? entry.reminderMinutes : undefined,
            reminderTime: entry.reminderOn
              ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
              : undefined,
          });
        }
        savedCount += 1;
      } catch (e) {
        pushError(errors, label, e instanceof Error ? e.message : 'Save failed.');
      }
    }
  }

  if (sections.vaccination.enabled) {
    for (let i = 0; i < sections.vaccination.entries.length; i += 1) {
      const entry = sections.vaccination.entries[i];
      const label = `Vaccination ${i + 1}`;
      if (!entry.vaccineName.trim()) {
        pushError(errors, label, 'Enter a vaccine name.');
        continue;
      }
      if (!entry.dueDate) {
        pushError(errors, label, 'Select a due date.');
        continue;
      }
      const noteText = entry.notes.trim();
      const payload = {
        dueDate: dateToApiDateString(entry.dueDate),
        reminder: entry.reminderOn,
        frequency: entry.frequency,
        reminderTime: dateToTimeHHmm(entry.reminderTime),
        notes: noteText || undefined,
      };
      try {
        if (entry.scheduleId) {
          await updateVaccinationSchedule(token, entry.scheduleId, payload);
        } else {
          await createVaccinationSchedule(token, {
            petId,
            vaccineName: entry.vaccineName.trim(),
            ...payload,
            isRecurring: entry.isRecurring,
            recurrenceInterval: entry.isRecurring ? entry.recurrenceInterval : undefined,
          });
        }
        savedCount += 1;
      } catch (e) {
        pushError(errors, label, e instanceof Error ? e.message : 'Save failed.');
      }
    }
  }

  if (sections.grooming.enabled) {
    if (options.groomingVisible === false) {
      pushError(errors, 'Grooming', 'Not available for this pet species.');
    } else {
      for (let i = 0; i < sections.grooming.entries.length; i += 1) {
        const entry = sections.grooming.entries[i];
        const label = `Grooming ${i + 1}`;
        if (!entry.groomingType) {
          pushError(errors, label, 'Select a grooming type.');
          continue;
        }
        const noteText = entry.notes.trim();
        try {
          if (entry.recordId) {
            await updateGroomingRecord(token, entry.recordId, {
              type: entry.groomingType,
              scheduledDate: entry.scheduledDate
                ? dateToApiDateString(entry.scheduledDate)
                : undefined,
              reminder: entry.reminderOn,
              notes: noteText || undefined,
            });
          } else {
            await createGroomingRecord(token, {
              petId,
              type: entry.groomingType,
              scheduledDate: entry.scheduledDate
                ? dateToApiDateString(entry.scheduledDate)
                : undefined,
              reminder: entry.reminderOn,
              notes: noteText || undefined,
            });
          }
          savedCount += 1;
        } catch (e) {
          pushError(errors, label, e instanceof Error ? e.message : 'Save failed.');
        }
      }
    }
  }

  return { savedCount, errors };
}

export function hasEnabledSection(sections: ScheduleSectionsState): boolean {
  return (
    sections.feeding.enabled ||
    sections.walk.enabled ||
    sections.medicine.enabled ||
    sections.vaccination.enabled ||
    sections.grooming.enabled
  );
}
