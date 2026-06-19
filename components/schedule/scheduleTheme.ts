import type { ScheduleSectionKey } from '@/lib/schedule/types';

export const ScheduleTheme = {
  screenBg: '#F5F6F8',
  cardBg: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#9E9E9E',
  fieldBg: '#FFFFFF',
  fieldBorder: '#D4D4D4',
  fieldBorderFocus: '#B0B0B0',
  dashedBorder: '#D0D0D0',
  ctaOrange: '#F48024',
  ctaOrangeShadow: '#D96A12',
} as const;

export interface ScheduleSectionTheme {
  key: ScheduleSectionKey;
  title: string;
  optional?: boolean;
  icon: 'bowl-mix-outline' | 'content-cut' | 'pill' | 'walk' | 'shield-plus-outline';
  color: string;
  bg: string;
  lightBg: string;
  addLabel: string;
}

export const SCHEDULE_SECTIONS: ScheduleSectionTheme[] = [
  {
    key: 'feeding',
    title: 'Feeding Schedule',
    icon: 'bowl-mix-outline',
    color: '#EF5350',
    bg: '#FFEBEE',
    lightBg: '#FFF5F5',
    addLabel: 'Add meal time',
  },
  {
    key: 'grooming',
    title: 'Grooming',
    optional: true,
    icon: 'content-cut',
    color: '#AB47BC',
    bg: '#F3E5F5',
    lightBg: '#FAF4FC',
    addLabel: 'Add Task',
  },
  {
    key: 'medicine',
    title: 'Medicine',
    optional: true,
    icon: 'pill',
    color: '#66BB6A',
    bg: '#E8F5E9',
    lightBg: '#F4FBF4',
    addLabel: 'Add Medicine',
  },
  {
    key: 'walk',
    title: 'Daily Walks',
    optional: true,
    icon: 'walk',
    color: '#5CB35D',
    bg: '#E8F5E9',
    lightBg: '#F4FBF4',
    addLabel: 'Add Walk',
  },
  {
    key: 'vaccination',
    title: 'Vaccinations',
    optional: true,
    icon: 'shield-plus-outline',
    color: '#42A5F5',
    bg: '#E3F2FD',
    lightBg: '#F0F8FF',
    addLabel: 'Add Vaccine',
  },
];

export function sectionDisplayTitle(section: ScheduleSectionTheme): string {
  return section.title;
}
