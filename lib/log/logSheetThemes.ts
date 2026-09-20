import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type MciIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface LogSheetTheme {
  color: string;
  bg: string;
  icon: MciIcon;
  gradient: readonly [string, string, ...string[]];
}

export const LOG_SHEET_THEMES = {
  food: { color: '#D97706', bg: '#FEF3C7', icon: 'silverware-fork-knife', gradient: ['#D97706', '#F59E0B'] as const },
  walk: { color: '#2563EB', bg: '#DBEAFE', icon: 'paw', gradient: ['#1D4ED8', '#2563EB', '#3B82F6'] as const },
  medicine: { color: '#9333EA', bg: '#F3E8FF', icon: 'pill', gradient: ['#6B21A8', '#9333EA', '#A855F7'] as const },
  grooming: { color: '#0D9488', bg: '#CCFBF1', icon: 'content-cut', gradient: ['#0F766E', '#0D9488', '#14B8A6'] as const },
  vaccination: { color: '#DB2777', bg: '#FCE7F3', icon: 'needle', gradient: ['#BE185D', '#DB2777', '#EC4899'] as const },
} as const satisfies Record<string, LogSheetTheme>;
