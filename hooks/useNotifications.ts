import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications/notificationApi';
import type { ApiNotification } from '@/types/notification';
import { useNotificationStore } from '@/context/NotificationContext';

// Stable query key factory
const notificationsKey = (token: string | null) => ['notifications', token] as const;

export function useNotifications(token: string | null) {
  const queryClient = useQueryClient();
  const { unreadCount, setUnreadCount, decrementUnreadCount, clearBadge } = useNotificationStore();

  // ── React Query with stale-while-revalidate so returning to the screen shows
  //    cached data immediately (no skeleton flash) while refreshing in the background.
  const query = useQuery<ApiNotification[], Error>({
    queryKey: notificationsKey(token),
    queryFn: async () => {
      if (!token) return [];
      const rows = await fetchNotifications(token);
      // Sync unread badge from the freshly-fetched data
      const computedUnread = rows.filter((item) => !item.isRead).length;
      setUnreadCount(computedUnread);
      return rows;
    },
    enabled: Boolean(token),
    // Keep previous data visible while revalidating — eliminates skeleton flash on focus
    staleTime: 1000 * 30,          // 30 s fresh window
    placeholderData: (prev) => prev,  // show stale data while fetching
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const items = query.data ?? [];
  const loading = query.isLoading;
  const hasLoaded = query.isFetched;
  const error = query.error ? getErrorMessage(query.error) : null;

  if (query.error) {
    log.fail('Notifications', 'Load failed', getErrorMessage(query.error));
  }

  const reload = useCallback(
    (forceRefresh = true) => {
      if (!token) return Promise.resolve();
      if (forceRefresh) {
        return queryClient.invalidateQueries({ queryKey: notificationsKey(token) });
      }
      return queryClient.refetchQueries({ queryKey: notificationsKey(token) });
    },
    [token, queryClient],
  );

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      // Optimistic update
      decrementUnreadCount();
      queryClient.setQueryData<ApiNotification[]>(notificationsKey(token), (prev) =>
        prev ? prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)) : prev,
      );
      // Non-blocking background API update then revalidate
      void markNotificationRead(token, id).then(() => reload(false));
    },
    [token, queryClient, decrementUnreadCount, reload],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    // Optimistic update
    clearBadge();
    queryClient.setQueryData<ApiNotification[]>(notificationsKey(token), (prev) =>
      prev ? prev.map((item) => ({ ...item, isRead: true })) : prev,
    );
    void markAllNotificationsRead(token).then(() => reload(false));
  }, [token, queryClient, clearBadge, reload]);

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      // Optimistic update: instantly remove from list
      queryClient.setQueryData<ApiNotification[]>(notificationsKey(token), (prev) =>
        prev ? prev.filter((item) => item._id !== id) : prev,
      );
      void deleteNotification(token, id).then(() => reload(false));
    },
    [token, queryClient, reload],
  );

  return {
    items,
    unreadCount,
    loading,
    hasLoaded,
    error,
    reload,
    markRead,
    markAllRead,
    remove,
  };
}
