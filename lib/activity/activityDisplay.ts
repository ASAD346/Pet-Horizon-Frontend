import type { ActivityCategory } from '@/types/activity';

type MaterialIcon =
  | 'silverware-fork-knife'
  | 'walk'
  | 'pill'
  | 'content-cut'
  | 'needle'
  | 'bell-outline'
  | 'star-outline';

const CATEGORY_STYLE: Record<
  ActivityCategory,
  { icon: MaterialIcon; color: string; bg: string; label: string }
> = {
  food: { icon: 'silverware-fork-knife', color: '#F5A623', bg: '#FFF4E0', label: 'Food' },
  walk: { icon: 'walk', color: '#5CB35D', bg: '#E8F5E9', label: 'Walk' },
  medicine: { icon: 'pill', color: '#5B9BD5', bg: '#E3F2FD', label: 'Medicine' },
  grooming: { icon: 'content-cut', color: '#E91E8C', bg: '#FCE4F0', label: 'Grooming' },
  vaccination: { icon: 'needle', color: '#673AB7', bg: '#EDE7F6', label: 'Vaccination' },
  reminder: { icon: 'bell-outline', color: '#FF7043', bg: '#FBE9E7', label: 'Reminder' },
  custom: { icon: 'star-outline', color: '#78909C', bg: '#ECEFF1', label: 'Custom' },
};

export function activityCategoryStyle(category: string) {
  if (category in CATEGORY_STYLE) {
    return CATEGORY_STYLE[category as ActivityCategory];
  }
  return CATEGORY_STYLE.custom;
}

export function formatActivityTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'food',
  'walk',
  'medicine',
  'grooming',
  'vaccination',
  'reminder',
  'custom',
];
