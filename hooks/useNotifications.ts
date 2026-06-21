import { useCallback, useMemo, useState } from 'react';
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

export function useNotifications(token: string | null) {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items],
  );

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
