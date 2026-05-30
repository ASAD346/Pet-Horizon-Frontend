import { formatCompletedAt, formatTimeHHmmDisplay } from '@/lib/feeding/feedingForm';
import { getWalkTimeLabel } from '@/lib/walk/walkForm';
import type { WalkScheduleItem } from '@/types/walk';

const WALK_TIME_COLORS: Record<string, { color: string; bg: string }> = {
  morning: { color: '#5CB35D', bg: '#E8F5E9' },
  afternoon: { color: '#F5A623', bg: '#FFF8E1' },
  evening: { color: '#5B9BD5', bg: '#E3F2FD' },
  night: { color: '#7E57C2', bg: '#EDE7F6' },
};

export function walkScheduleTitle(item: WalkScheduleItem): string {
  const walkTime = item.metadata?.walkTime;
  if (walkTime) return `${getWalkTimeLabel(walkTime)} Walk`;
  return item.title || 'Walk';
}

export function walkScheduleSubtitle(item: WalkScheduleItem): string {
  const duration = item.metadata?.duration;
  const durationText = duration ? `${duration} min · ` : '';

  if (item.status === 'done') {
    const when = item.completedAt ? formatCompletedAt(item.completedAt) : formatTimeHHmmDisplay(item.timeOfDay);
    return `${durationText}Done at ${when}`;
  }

  if (item.status === 'skipped') {
    return `${durationText}Skipped today`;
  }

  return `${durationText}Scheduled for ${formatTimeHHmmDisplay(item.timeOfDay)}`;
}

export function walkScheduleColors(item: WalkScheduleItem) {
  const key = (item.metadata?.walkTime ?? '').toLowerCase();
  return WALK_TIME_COLORS[key] ?? { color: '#5CB35D', bg: '#E8F5E9' };
}

export function sortWalkByTime(items: WalkScheduleItem[]): WalkScheduleItem[] {
  return [...items].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
}

export function pendingWalkSchedules(items: WalkScheduleItem[]): WalkScheduleItem[] {
  return sortWalkByTime(items.filter((item) => item.status !== 'done' && item.status !== 'skipped'));
}
