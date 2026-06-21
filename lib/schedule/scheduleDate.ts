import { dateToApiDateString, formatDateLabel } from '@/lib/grooming/groomingForm';
import { apiDateStringToDate } from '@/lib/feeding/feedingForm';

export type ScheduleDateMode = 'single' | 'range' | 'ongoing';

export interface ScheduleDateState {
  mode: ScheduleDateMode;
  singleDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface ScheduleDateApiFields {
  date?: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface ScheduleDateApiInput {
  date?: string | null;
  scheduleDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export const SCHEDULE_DATE_MODE_OPTIONS: { value: ScheduleDateMode; label: string }[] = [
  { value: 'single', label: 'Single day' },
  { value: 'range', label: 'Date range' },
  { value: 'ongoing', label: 'Ongoing' },
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function createDefaultScheduleDate(mode: ScheduleDateMode = 'ongoing'): ScheduleDateState {
  const today = startOfToday();
  if (mode === 'single') {
    return { mode, singleDate: today, startDate: null, endDate: null };
  }
  if (mode === 'range') {
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    return { mode, singleDate: null, startDate: today, endDate: end };
  }
  return { mode, singleDate: null, startDate: today, endDate: null };
}

export function parseScheduleDateFromApi(input: ScheduleDateApiInput = {}): ScheduleDateState {
  const explicitDate = apiDateStringToDate(input.date ?? input.scheduleDate ?? undefined);
  const start = apiDateStringToDate(input.startDate ?? undefined);
  const end = apiDateStringToDate(input.endDate ?? undefined);

  if (explicitDate && !start && !end) {
    return { mode: 'single', singleDate: explicitDate, startDate: null, endDate: null };
  }

  if (start && end) {
    if (isSameCalendarDay(start, end)) {
      return { mode: 'single', singleDate: start, startDate: null, endDate: null };
    }
    return { mode: 'range', singleDate: null, startDate: start, endDate: end };
  }

  if (start && !end) {
    return { mode: 'ongoing', singleDate: null, startDate: start, endDate: null };
  }

  if (explicitDate) {
    return { mode: 'single', singleDate: explicitDate, startDate: null, endDate: null };
  }

  return createDefaultScheduleDate('ongoing');
}

export function setScheduleDateMode(
  current: ScheduleDateState,
  mode: ScheduleDateMode,
): ScheduleDateState {
  const today = startOfToday();

  if (mode === 'single') {
    const singleDate = current.singleDate ?? current.startDate ?? today;
    return { mode, singleDate, startDate: null, endDate: null };
  }

  if (mode === 'range') {
    const startDate = current.startDate ?? current.singleDate ?? today;
    const endDate =
      current.endDate ??
      (() => {
        const fallback = new Date(startDate);
        fallback.setDate(fallback.getDate() + 7);
        return fallback;
      })();
    return { mode, singleDate: null, startDate, endDate };
  }

  const startDate = current.startDate ?? current.singleDate ?? today;
  return { mode, singleDate: null, startDate, endDate: null };
}

export function validateScheduleDate(state: ScheduleDateState): string | null {
  if (state.mode === 'single' && !state.singleDate) {
    return 'Select a date.';
  }
  if (state.mode === 'range') {
    if (!state.startDate || !state.endDate) return 'Select start and end dates.';
    if (state.startDate.getTime() > state.endDate.getTime()) {
      return 'Start date must be before or equal to end date.';
    }
  }
  if (state.mode === 'ongoing' && !state.startDate) {
    return 'Select a start date.';
  }
  return null;
}

export function buildScheduleDatePayload(state: ScheduleDateState): ScheduleDateApiFields {
  if (state.mode === 'single' && state.singleDate) {
    const date = dateToApiDateString(state.singleDate);
    return { date, scheduleDate: date };
  }

  if (state.mode === 'range' && state.startDate && state.endDate) {
    return {
      startDate: dateToApiDateString(state.startDate),
      endDate: dateToApiDateString(state.endDate),
    };
  }

  if (state.mode === 'ongoing' && state.startDate) {
    return { startDate: dateToApiDateString(state.startDate) };
  }

  return {};
}

export function buildVaccinationDatePayload(
  state: ScheduleDateState,
): ScheduleDateApiFields & { dueDate?: string } {
  const payload = buildScheduleDatePayload(state);
  if (state.mode === 'single' && state.singleDate) {
    const dueDate = dateToApiDateString(state.singleDate);
    return { ...payload, dueDate };
  }
  return payload;
}

export function buildGroomingDatePayload(
  state: ScheduleDateState,
): ScheduleDateApiFields & { scheduledDate?: string } {
  const payload = buildScheduleDatePayload(state);
  if (state.mode === 'single' && state.singleDate) {
    const scheduledDate = dateToApiDateString(state.singleDate);
    return { ...payload, scheduledDate };
  }
  return payload;
}

export function formatScheduleDateSummary(state: ScheduleDateState): string {
  if (state.mode === 'single') {
    return state.singleDate ? formatDateLabel(state.singleDate) : 'Single day';
  }
  if (state.mode === 'range') {
    if (state.startDate && state.endDate) {
      return `${formatDateLabel(state.startDate)} – ${formatDateLabel(state.endDate)}`;
    }
    return 'Date range';
  }
  return state.startDate ? `From ${formatDateLabel(state.startDate)}` : 'Ongoing';
}
