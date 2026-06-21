import {
  addMinutesToTimeHHmm,
  dateToTimeHHmm,
} from '@/lib/feeding/feedingForm';
import {
  buildDoseString,
  parseTotalPills,
} from '@/lib/medicine/medicineForm';
import type { ScheduleSectionsState } from '@/lib/schedule/types';
import {
  buildGroomingDatePayload,
  buildScheduleDatePayload,
  buildVaccinationDatePayload,
  validateScheduleDate,
} from '@/lib/schedule/scheduleDate';
import { createGroomingRecord } from '@/services/grooming/groomingApi';
import { createFeedingSchedule } from '@/services/schedules/feedingApi';
import { createMedicineSchedule } from '@/services/schedules/medicineApi';
import { createVaccinationSchedule } from '@/services/schedules/vaccinationApi';
import { createWalkSchedule } from '@/services/schedules/walkApi';
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
      const dateError = validateScheduleDate(entry.scheduleDate);
      if (dateError) {
        pushError(errors, label, dateError);
        continue;
      }
      try {
        await createFeedingSchedule(token, {
          petId,
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
          ...buildScheduleDatePayload(entry.scheduleDate),
        });
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
      const dateError = validateScheduleDate(entry.scheduleDate);
      if (dateError) {
        pushError(errors, label, dateError);
        continue;
      }
      try {
        await createWalkSchedule(token, {
          petId,
          walkTime: entry.walkTime,
          time: timeHHmm,
          duration: durationMinutes,
          notes: noteText || undefined,
          reminder: entry.notificationsOn,
          reminderMinutes: entry.notificationsOn ? entry.reminderMinutes : undefined,
          reminderTime: entry.notificationsOn
            ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
            : undefined,
          ...buildScheduleDatePayload(entry.scheduleDate),
        });
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
      const dateError = validateScheduleDate(entry.scheduleDate);
      if (dateError) {
        pushError(errors, label, dateError);
        continue;
      }
      const pills = parseTotalPills(entry.totalPills);
      if (pills === null) {
        pushError(errors, label, 'Enter a valid total quantity.');
        continue;
      }
      const timeHHmm = dateToTimeHHmm(entry.medicineTime);
      const noteText = entry.notes.trim();
      try {
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
          notes: noteText || undefined,
          ...buildScheduleDatePayload(entry.scheduleDate),
          reminder: entry.reminderOn,
          reminderMinutes: entry.reminderOn ? entry.reminderMinutes : undefined,
          reminderTime: entry.reminderOn
            ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
            : undefined,
        });
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
      const dateError = validateScheduleDate(entry.scheduleDate);
      if (dateError) {
        pushError(errors, label, dateError);
        continue;
      }
      const noteText = entry.notes.trim();
      const datePayload = buildVaccinationDatePayload(entry.scheduleDate);
      try {
        await createVaccinationSchedule(token, {
          petId,
          vaccineName: entry.vaccineName.trim(),
          dueDate: datePayload.dueDate ?? datePayload.date ?? datePayload.startDate ?? '',
          ...datePayload,
          reminder: entry.reminderOn,
          frequency: entry.frequency,
          reminderTime: dateToTimeHHmm(entry.reminderTime),
          isRecurring: entry.isRecurring,
          recurrenceInterval: entry.isRecurring ? entry.recurrenceInterval : undefined,
          notes: noteText || undefined,
        });
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
        const dateError = validateScheduleDate(entry.scheduleDate);
        if (dateError) {
          pushError(errors, label, dateError);
          continue;
        }
        const noteText = entry.notes.trim();
        try {
          await createGroomingRecord(token, {
            petId,
            type: entry.groomingType,
            ...buildGroomingDatePayload(entry.scheduleDate),
            reminder: entry.reminderOn,
            notes: noteText || undefined,
          });
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
