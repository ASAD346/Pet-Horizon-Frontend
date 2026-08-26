import { Spacing } from '@/constants/theme';

/** Floating tab bar pill height (matches `app/(tabs)/_layout.tsx`). */
export const TAB_BAR_HEIGHT = 68;

/** Gap between the tab bar and the system navigation / home indicator. */
export const TAB_BAR_FLOAT_GAP = 8;

/** Horizontal inset of the floating tab bar. */
export const TAB_BAR_SIDE_MARGIN = 16;

export interface TabBarLayoutMetrics {
  bottomOffset: number;
  clearance: number;
  height: number;
}

/**
 * Layout metrics for the floating bottom tab bar.
 * `clearance` is how much space scroll content needs at the bottom.
 */
export function getTabBarMetrics(insetsBottom: number): TabBarLayoutMetrics {
  const actualPaddingBottom = insetsBottom || 12;
  const height = 72 + actualPaddingBottom;
  
  // The central FAB button has a marginTop of -42, meaning it extends 42px above the tab bar.
  // We add this 42px to the clearance to ensure list contents do not get hidden behind it.
  const clearance = height + 42 + Spacing.md;
  
  return {
    bottomOffset: 0,
    clearance,
    height,
  };
}
