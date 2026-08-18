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

let cachedNotifications: ApiNotification[] = [];
let hasLoadedNotifications = false;

export function useNotifications(token: string | null) {
  const [items, setItems] = useState<ApiNotification[]>(() => cachedNotifications);
  const [loading, setLoading] = useState(() => Boolean(token && !hasLoadedNotifications));
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
      cachedNotifications = rows;
      hasLoadedNotifications = true;
      setItems(rows);
      setError(null);
      const computedUnread = rows.filter((item) => !item.isRead).length;
      setUnreadCount(computedUnread);
    },
    onClear: () => {
      if (!hasLoadedNotifications) {
        setItems([]);
      }
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad && !hasLoadedNotifications) {
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
      // Non-blocking background API update
      void markNotificationRead(token, id).then(() => {
        void reload(false, true);
      });
    },
    [token, reload, decrementUnreadCount],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    // Optimistic update
    clearBadge();
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    void markAllNotificationsRead(token).then(() => {
      void reload(false, true);
    });
  }, [token, reload, clearBadge]);

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      // Optimistic update: instantly remove from list
      setItems((prev) => prev.filter((item) => item._id !== id));
      void deleteNotification(token, id).then(() => {
        void reload(false, true);
      });
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
