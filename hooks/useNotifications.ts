import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications/notificationApi';
import type { ApiNotification } from '@/types/notification';
import { useStaleFocusLoader } from './useStaleFocusLoader';
import { useNotificationStore } from '@/context/NotificationContext';

export function useNotifications(token: string | null) {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { unreadCount, setUnreadCount, decrementUnreadCount, clearBadge } = useNotificationStore();

  const load = useCallback(async () => {
    if (!token) return [];
    return fetchNotifications(token);
  }, [token]);

  const reload = useStaleFocusLoader({
    scopeKey: token,
    enabled: Boolean(token),
    load,
    onSuccess: (rows) => {
      setItems(rows);
      setError(null);
      const computedUnread = rows.filter((item) => !item.isRead).length;
      setUnreadCount(computedUnread);
    },
    onClear: () => {
      setItems([]);
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad) {
        setItems([]);
        setError(getErrorMessage(err));
        log.fail('Notifications', 'Load failed', getErrorMessage(err));
      }
    },
    setLoading,
  });

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      // Optimistic update
      decrementUnreadCount();
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      await markNotificationRead(token, id);
      await reload();
    },
    [token, reload, decrementUnreadCount],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    // Optimistic update
    clearBadge();
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await markAllNotificationsRead(token);
    await reload();
  }, [token, reload, clearBadge]);

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      await deleteNotification(token, id);
      await reload();
    },
    [token, reload],
  );

  return {
    items,
    unreadCount,
    loading,
    error,
    reload,
    markRead,
    markAllRead,
    remove,
  };
}
