import type { FeedingScheduleItem } from '@/types/feeding';
import {
  feedingMealColors,
  formatCompletedAt,
  formatTimeHHmmDisplay,
  formatUnitLabel,
  getMealTypeLabel,
} from '@/lib/feeding/feedingForm';

export function feedingScheduleTitle(item: FeedingScheduleItem): string {
  const mealType = item.metadata?.mealType;
  if (mealType) return getMealTypeLabel(mealType);
  return item.title.replace(/\s+Feeding$/i, '') || item.title;
}

export function feedingScheduleSubtitle(item: FeedingScheduleItem): string {
  const amount = item.metadata?.amount;
  const unit = item.metadata?.unit;
  
  let portion = '';
  if (amount) {
    if (unit) {
      const num = parseFloat(amount);
      let uLabel = formatUnitLabel(unit);
      if (uLabel.toLowerCase() === 'cup' && num > 1) {
        uLabel = 'cups';
      }
      portion = `${amount} ${uLabel} · `;
    } else {
      portion = `${amount} · `;
    }
  }

  if (item.status === 'done') {
    const when = item.completedAt ? formatCompletedAt(item.completedAt) : formatTimeHHmmDisplay(item.timeOfDay);
    return `${portion}Done at ${when}`;
  }

  if (item.status === 'skipped') {
    return `${portion}Skipped today`;
  }

  return `${portion}Scheduled for ${formatTimeHHmmDisplay(item.timeOfDay)}`;
}

export function feedingScheduleColors(item: FeedingScheduleItem) {
  return feedingMealColors(item.metadata?.mealType);
}

export function sortFeedingByTime(items: FeedingScheduleItem[]): FeedingScheduleItem[] {
  return [...items].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
}

export function pendingFeedingSchedules(items: FeedingScheduleItem[]): FeedingScheduleItem[] {
  return sortFeedingByTime(items.filter((item) => item.status !== 'done' && item.status !== 'skipped'));
}
