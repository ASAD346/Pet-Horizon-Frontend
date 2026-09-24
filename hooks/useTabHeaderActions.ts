import { type Href } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useDebouncedRouter } from '@/hooks/useDebounce';

export function useTabHeaderActions() {
  const router = useDebouncedRouter();
  const { token } = useAuth();
  const { unreadCount } = useNotifications(token);

  const onNotificationsPress = useCallback(() => {
    router.navigate('/notifications' as Href);
  }, [router]);

  return {
    notificationCount: unreadCount,
    onNotificationsPress,
  };
}
