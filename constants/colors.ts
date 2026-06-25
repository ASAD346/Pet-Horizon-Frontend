import { Palette } from './theme';

export const Colors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  text: '#212121',
  textMuted: '#616161',
  textLight: '#9E9E9E',
  border: '#E8E8E8',
  
  // Brand color usage - limited to highlights and key actions
  primary: Palette.success,        // deep organic emerald green
  primaryLight: Palette.successLight,
  accent: Palette.primary.base,    // deep navy
  secondary: Palette.secondary.base,
  
  // Status Colors
  success: Palette.success,
  error: Palette.error,
  warning: Palette.warning,
  info: Palette.info,
  
  // Premium Styling
  premiumGold: Palette.premium.gold,
  premiumBg: Palette.premium.emerald,
} as const;

export type ColorType = typeof Colors[keyof typeof Colors];
