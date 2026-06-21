import {
  addMinutesToTimeHHmm,
  dateToTimeHHmm,
} from '@/lib/feeding/feedingForm';
import {
  buildDoseString,
  parseTotalPills,
} from '@/lib/medicine/medicineForm';
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
import {
  buildGroomingDatePayload,
  buildScheduleDatePayload,
  buildVaccinationDatePayload,
  validateScheduleDate,
} from '@/lib/schedule/scheduleDate';
import type {
  FeedingEntryState,
  GroomingEntryState,
  MedicineEntryState,
  ScheduleSectionKey,
  VaccinationEntryState,
  WalkEntryState,
} from './types';

export async function saveScheduleEntry(
  token: string,
  petId: string,
  key: ScheduleSectionKey,
  entry:
    | FeedingEntryState
    | WalkEntryState
    | MedicineEntryState
    | VaccinationEntryState
    | GroomingEntryState,
  options: { groomingVisible?: boolean } = {},
): Promise<void> {
  switch (key) {
    case 'feeding':
      await saveFeedingEntry(token, petId, entry as FeedingEntryState);
      return;
    case 'walk':
      await saveWalkEntry(token, petId, entry as WalkEntryState);
      return;
    case 'medicine':
      await saveMedicineEntry(token, petId, entry as MedicineEntryState);
      return;
    case 'vaccination':
      await saveVaccinationEntry(token, petId, entry as VaccinationEntryState);
      return;
    case 'grooming':
      await saveGroomingEntry(token, petId, entry as GroomingEntryState, options.groomingVisible);
      return;
    default:
      throw new Error('Unknown schedule type.');
  }
}

async function saveFeedingEntry(token: string, petId: string, entry: FeedingEntryState) {
  if (!entry.mealType) throw new Error('Select a meal type.');
  if (!entry.unit) throw new Error('Select a unit.');
  if (!entry.amount.trim()) throw new Error('Enter an amount.');
  const dateError = validateScheduleDate(entry.scheduleDate);
  if (dateError) throw new Error(dateError);

  const timeHHmm = dateToTimeHHmm(entry.feedingTime);
  const noteText = entry.notes.trim();
  const body = {
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
  };

  if (entry.scheduleId) {
    await updateFeedingSchedule(token, entry.scheduleId, body);
    return;
  }

  await createFeedingSchedule(token, { petId, ...body });
}

async function saveWalkEntry(token: string, petId: string, entry: WalkEntryState) {
  const durationMinutes = parseDurationMinutes(entry.duration);
  if (!durationMinutes) throw new Error('Enter a valid duration in minutes.');
  const dateError = validateScheduleDate(entry.scheduleDate);
  if (dateError) throw new Error(dateError);

  const timeHHmm = dateToTimeHHmm(entry.walkClockTime);
  const noteText = entry.notes.trim();
  const body = {
    time: timeHHmm,
    duration: durationMinutes,
    notes: noteText || undefined,
    reminder: entry.notificationsOn,
    reminderMinutes: entry.notificationsOn ? entry.reminderMinutes : undefined,
    reminderTime: entry.notificationsOn
      ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
      : undefined,
    ...buildScheduleDatePayload(entry.scheduleDate),
  };

  if (entry.scheduleId) {
    await updateWalkSchedule(token, entry.scheduleId, body);
    return;
  }

  await createWalkSchedule(token, {
    petId,
    walkTime: entry.walkTime,
    ...body,
  });
}

async function saveMedicineEntry(token: string, petId: string, entry: MedicineEntryState) {
  const name = entry.medicineName.trim();
  if (!name) throw new Error('Enter a medicine name.');
  const dose = buildDoseString(entry.doseAmount, entry.doseForm);
  if (!dose) throw new Error('Enter a valid dose amount.');
  if (entry.frequency === 'weekly' && entry.daysOfWeek.length === 0) {
    throw new Error('Select at least one day for a weekly schedule.');
  }
  const dateError = validateScheduleDate(entry.scheduleDate);
  if (dateError) throw new Error(dateError);
  const pills = parseTotalPills(entry.totalPills);
  if (pills === null) throw new Error('Enter a valid total quantity.');

  const timeHHmm = dateToTimeHHmm(entry.medicineTime);
  const noteText = entry.notes.trim();
  const datePayload = buildScheduleDatePayload(entry.scheduleDate);

  if (entry.scheduleId) {
    await updateMedicineSchedule(token, entry.scheduleId, {
      dose,
      time: timeHHmm,
      doseForm: entry.doseForm,
      remainingPills: pills,
      ...datePayload,
      notes: noteText || undefined,
      reminder: entry.reminderOn,
      reminderMinutes: entry.reminderOn ? entry.reminderMinutes : undefined,
      reminderTime: entry.reminderOn
        ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
        : undefined,
    });
    return;
  }

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
    ...datePayload,
    reminder: entry.reminderOn,
    reminderMinutes: entry.reminderOn ? entry.reminderMinutes : undefined,
    reminderTime: entry.reminderOn
      ? addMinutesToTimeHHmm(timeHHmm, entry.reminderMinutes)
      : undefined,
  });
}

async function saveVaccinationEntry(token: string, petId: string, entry: VaccinationEntryState) {
  if (!entry.vaccineName.trim()) throw new Error('Enter a vaccine name.');
  const dateError = validateScheduleDate(entry.scheduleDate);
  if (dateError) throw new Error(dateError);

  const noteText = entry.notes.trim();
  const reminderTime = dateToTimeHHmm(entry.reminderTime);
  const datePayload = buildVaccinationDatePayload(entry.scheduleDate);

  if (entry.scheduleId) {
    await updateVaccinationSchedule(token, entry.scheduleId, {
      ...datePayload,
      reminder: entry.reminderOn,
      frequency: entry.frequency,
      reminderTime,
      notes: noteText || undefined,
    });
    return;
  }

  if (!datePayload.dueDate && entry.scheduleDate.mode === 'single') {
    throw new Error('Select a due date.');
  }

  await createVaccinationSchedule(token, {
    petId,
    vaccineName: entry.vaccineName.trim(),
    dueDate: datePayload.dueDate ?? datePayload.date ?? datePayload.startDate ?? '',
    ...datePayload,
    reminder: entry.reminderOn,
    frequency: entry.frequency,
    reminderTime,
    isRecurring: entry.isRecurring,
    recurrenceInterval: entry.isRecurring ? entry.recurrenceInterval : undefined,
    notes: noteText || undefined,
  });
}

async function saveGroomingEntry(
  token: string,
  petId: string,
  entry: GroomingEntryState,
  groomingVisible?: boolean,
) {
  if (groomingVisible === false) {
    throw new Error('Grooming is not available for this pet species.');
  }
  if (!entry.groomingType) throw new Error('Select a grooming type.');
  const dateError = validateScheduleDate(entry.scheduleDate);
  if (dateError) throw new Error(dateError);

  const noteText = entry.notes.trim();
  const datePayload = buildGroomingDatePayload(entry.scheduleDate);
  const body = {
    type: entry.groomingType,
    ...datePayload,
    reminder: entry.reminderOn,
    notes: noteText || undefined,
  };

  if (entry.recordId) {
    await updateGroomingRecord(token, entry.recordId, body);
    return;
  }

  await createGroomingRecord(token, { petId, ...body });
}
