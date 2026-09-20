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
  fabBottom: number;
  fabClearance: number;
}

/**
 * Layout metrics for the bottom tab bar.
 * `clearance` is how much space scroll content needs at the bottom (~20px above tab bar).
 * `fabBottom` is the exact bottom offset to position a FAB neatly above the tab bar.
 * `fabClearance` is scroll content padding for screens with a FAB.
 */
export function getTabBarMetrics(insetsBottom: number): TabBarLayoutMetrics {
  const actualPaddingBottom = insetsBottom || 12;
  const height = 72 + actualPaddingBottom;
  const clearance = height + 20;
  const fabBottom = height + 16;
  const fabClearance = height + 72;
  
  return {
    bottomOffset: 0,
    clearance,
    height,
    fabBottom,
    fabClearance,
  };
}
