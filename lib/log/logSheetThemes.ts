import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type MciIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface LogSheetTheme {
  color: string;
  bg: string;
  icon: MciIcon;
}

export const LOG_SHEET_THEMES = {
  food: { color: '#F5A623', bg: '#FFF4E0', icon: 'silverware-fork-knife' },
  walk: { color: '#5CB35D', bg: '#E8F5E9', icon: 'walk' },
  medicine: { color: '#5B9BD5', bg: '#E3F2FD', icon: 'pill' },
  grooming: { color: '#E91E8C', bg: '#FCE4F0', icon: 'content-cut' },
  vaccination: { color: '#673AB7', bg: '#EDE7F6', icon: 'needle' },
} as const satisfies Record<string, LogSheetTheme>;
