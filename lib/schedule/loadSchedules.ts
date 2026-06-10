import { fetchGroomingRecords } from '@/services/grooming/groomingApi';
import { fetchFeedingSchedules } from '@/services/schedules/feedingApi';
import { fetchMedicineSchedules } from '@/services/schedules/medicineApi';
import { fetchVaccinationSchedules } from '@/services/schedules/vaccinationApi';
import { fetchWalkSchedules } from '@/services/schedules/walkApi';
import type { GroomingRecord } from '@/types/grooming';
import type { FeedingScheduleItem } from '@/types/feeding';
import type { MedicineScheduleItem } from '@/types/medicine';
import type { VaccinationScheduleItem } from '@/types/vaccination';
import type { WalkScheduleItem } from '@/types/walk';
import type { VaccinationReminderFrequency } from '@/types/vaccination';
import {
  createFeedingEntry,
  createGroomingEntry,
  createMedicineEntry,
  createVaccinationEntry,
  createWalkEntry,
  newEntryId,
} from '@/lib/schedule/defaults';
import { parseDoseFromApi } from '@/lib/schedule/parseDose';
import { apiDateToLocalDate, reminderMinutesFromMeta, timeHHmmToDate } from '@/lib/schedule/scheduleTime';
import type { ScheduleSectionsState } from '@/lib/schedule/types';

function mapFeedingItem(item: FeedingScheduleItem) {
  const meta = item.metadata ?? {};
  const timeHHmm = item.timeOfDay || item.reminderTime || '08:00';
  const entry = createFeedingEntry(meta.mealType ?? '', meta.unit ?? '');
  return {
    ...entry,
    id: newEntryId(),
    scheduleId: item._id,
    mealType: meta.mealType ?? entry.mealType,
    amount: meta.amount ?? entry.amount,
    unit: meta.unit ?? entry.unit,
    feedingTime: timeHHmmToDate(timeHHmm),
    notificationsOn: meta.reminder ?? true,
    reminderMinutes: reminderMinutesFromMeta(timeHHmm, meta.reminderTime, meta.reminderMinutes),
    notes: item.notes ?? meta.notes ?? item.description ?? '',
  };
}

function mapWalkItem(item: WalkScheduleItem) {
  const meta = item.metadata ?? {};
  const timeHHmm = item.timeOfDay || '08:00';
  const entry = createWalkEntry();
  return {
    ...entry,
    id: newEntryId(),
    scheduleId: item._id,
    walkTime: meta.walkTime ?? entry.walkTime,
    duration: meta.duration != null ? String(meta.duration) : entry.duration,
    walkClockTime: timeHHmmToDate(timeHHmm),
    notificationsOn: meta.reminder ?? true,
    reminderMinutes: reminderMinutesFromMeta(timeHHmm, meta.reminderTime, meta.reminderMinutes),
    notes: item.notes ?? meta.notes ?? item.description ?? '',
  };
}

function mapMedicineItem(item: MedicineScheduleItem) {
  const meta = item.metadata ?? {};
  const timeHHmm = item.timeOfDay || '10:30';
  const { amount, doseForm } = parseDoseFromApi(meta.dose);
  const entry = createMedicineEntry();
  return {
    ...entry,
    id: newEntryId(),
    scheduleId: item._id,
    medicineName: meta.medicineName ?? item.title ?? '',
    doseAmount: amount,
    doseForm: meta.doseForm ?? doseForm,
    frequency: meta.frequency ?? entry.frequency,
    daysOfWeek: meta.daysOfWeek ?? entry.daysOfWeek,
    medicineTime: timeHHmmToDate(timeHHmm),
    startDate: apiDateToLocalDate(item.startDate),
    endDate: apiDateToLocalDate(item.endDate),
    totalPills: meta.totalPills != null ? String(meta.totalPills) : entry.totalPills,
    remainingPills: meta.remainingPills != null ? String(meta.remainingPills) : undefined,
    lowStockThreshold:
      meta.lowStockThreshold != null ? String(meta.lowStockThreshold) : entry.lowStockThreshold,
    reminderOn: meta.reminder ?? true,
    reminderMinutes: reminderMinutesFromMeta(timeHHmm, meta.reminderTime, meta.reminderMinutes),
    notes: item.notes ?? meta.notes ?? item.description ?? '',
  };
}

function mapVaccinationItem(item: VaccinationScheduleItem) {
  const meta = item.metadata ?? {};
  const due = apiDateToLocalDate(meta.dueDate ?? item.startDate);
  const reminderHHmm = meta.reminderTime ?? item.reminderTime ?? '09:00';
  const entry = createVaccinationEntry();
  const freq = (meta.frequency ?? entry.frequency) as VaccinationReminderFrequency;
  return {
    ...entry,
    id: newEntryId(),
    scheduleId: item._id,
    vaccineName: meta.vaccineName ?? item.title ?? '',
    dueDate: due,
    reminderOn: meta.reminder ?? entry.reminderOn,
    frequency: freq,
    reminderTime: timeHHmmToDate(reminderHHmm),
    isRecurring: meta.isRecurring ?? entry.isRecurring,
    recurrenceInterval: meta.recurrenceInterval ?? entry.recurrenceInterval,
    notes: item.notes ?? meta.notes ?? item.description ?? '',
  };
}

function mapGroomingItem(record: GroomingRecord) {
  const entry = createGroomingEntry(record.groomingType ?? '');
  return {
    ...entry,
    id: newEntryId(),
    recordId: record._id,
    groomingType: record.groomingType ?? entry.groomingType,
    scheduledDate: apiDateToLocalDate(record.scheduledDate),
    reminderOn: record.reminderEnabled ?? true,
    notes: record.notes ?? '',
  };
}

export async function loadExistingSchedules(
  token: string,
  petId: string,
  defaults: { mealType: string; unit: string; groomingType: string },
): Promise<ScheduleSectionsState> {
  const [feeding, walks, medicine, vaccination, grooming] = await Promise.all([
    fetchFeedingSchedules(token, petId).catch(() => [] as FeedingScheduleItem[]),
    fetchWalkSchedules(token, petId).catch(() => [] as WalkScheduleItem[]),
    fetchMedicineSchedules(token, petId).catch(() => [] as MedicineScheduleItem[]),
    fetchVaccinationSchedules(token, petId).catch(() => [] as VaccinationScheduleItem[]),
    fetchGroomingRecords(token, petId, 'upcoming').catch(() => [] as GroomingRecord[]),
  ]);

  return {
    feeding: {
      enabled: feeding.length > 0,
      entries:
        feeding.length > 0
          ? feeding.map(mapFeedingItem)
          : [createFeedingEntry(defaults.mealType, defaults.unit)],
    },
    walk: {
      enabled: walks.length > 0,
      entries: walks.length > 0 ? walks.map(mapWalkItem) : [createWalkEntry()],
    },
    medicine: {
      enabled: medicine.length > 0,
      entries: medicine.length > 0 ? medicine.map(mapMedicineItem) : [createMedicineEntry()],
    },
    vaccination: {
      enabled: vaccination.length > 0,
      entries:
        vaccination.length > 0 ? vaccination.map(mapVaccinationItem) : [createVaccinationEntry()],
    },
    grooming: {
      enabled: grooming.length > 0,
      entries:
        grooming.length > 0
          ? grooming.map(mapGroomingItem)
          : [createGroomingEntry(defaults.groomingType)],
    },
  };
}
