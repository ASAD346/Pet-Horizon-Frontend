import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarMetrics } from '@/lib/layout/tabBarMetrics';

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  return getTabBarMetrics(insets.bottom);
}
