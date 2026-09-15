/** API date string (YYYY-MM-DD). */
export function dateToApiDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function defaultScheduledDate(): Date {
  const d = new Date();
  const res = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  res.setDate(res.getDate() + 7);
  return res;
}

import { getTaskDisplayName } from '@/src/utils/taskMappings';

export function groomingTypeLabel(value: string): string {
  return getTaskDisplayName(value);
}
