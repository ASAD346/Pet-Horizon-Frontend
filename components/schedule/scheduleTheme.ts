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
    color: '#D97706',
    bg: '#FEF3C7',
    lightBg: '#FFFDF0',
    addLabel: 'Add meal time',
  },
  {
    key: 'grooming',
    title: 'Grooming',
    optional: true,
    icon: 'content-cut',
    color: '#0D9488',
    bg: '#CCFBF1',
    lightBg: '#F2FDFB',
    addLabel: 'Add Task',
  },
  {
    key: 'medicine',
    title: 'Medicine',
    optional: true,
    icon: 'pill',
    color: '#9333EA',
    bg: '#F3E8FF',
    lightBg: '#FAF5FF',
    addLabel: 'Add Medicine',
  },
  {
    key: 'walk',
    title: 'Daily Walks',
    optional: true,
    icon: 'walk',
    color: '#2563EB',
    bg: '#DBEAFE',
    lightBg: '#F0F4FF',
    addLabel: 'Add Walk',
  },
  {
    key: 'vaccination',
    title: 'Vaccinations',
    optional: true,
    icon: 'shield-plus-outline',
    color: '#DB2777',
    bg: '#FCE7F3',
    lightBg: '#FFF5F9',
    addLabel: 'Add Vaccine',
  },
];

export function sectionDisplayTitle(section: ScheduleSectionTheme): string {
  return section.title;
}
