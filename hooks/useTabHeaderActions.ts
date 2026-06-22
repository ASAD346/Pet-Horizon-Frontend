import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

export function useTabHeaderActions() {
  const router = useRouter();
  const { token } = useAuth();
  const { unreadCount } = useNotifications(token);

  const onNotificationsPress = useCallback(() => {
    router.push('/notifications' as Href);
  }, [router]);

  return {
    notificationCount: unreadCount,
    onNotificationsPress,
  };
}
