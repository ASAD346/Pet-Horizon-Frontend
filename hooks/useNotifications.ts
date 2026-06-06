import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications/notificationApi';
import type { ApiNotification } from '@/types/notification';

export function useNotifications(token: string | null) {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items],
  );

  const reload = useCallback(async () => {
    if (!token) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchNotifications(token);
      setItems(rows);
    } catch (err) {
      setItems([]);
      setError(getErrorMessage(err));
      log.fail('Notifications', 'Load failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      await markNotificationRead(token, id);
      await reload();
    },
    [token, reload],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    await markAllNotificationsRead(token);
    await reload();
  }, [token, reload]);

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
