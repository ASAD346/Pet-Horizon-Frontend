import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type { ApiNotification } from '@/types/notification';

const SCOPE = 'NotificationAPI';

export async function fetchNotifications(token: string): Promise<ApiNotification[]> {
  log.info(SCOPE, 'GET /notifications');
  try {
    const data = await apiRequest<ApiNotification[]>(API_ENDPOINTS.notifications.list, { token });
    log.ok(SCOPE, 'Notifications loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load notifications failed', getErrorMessage(error));
    throw error;
  }
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<ApiNotification> {
  log.info(SCOPE, 'PUT /notifications/:id/read', { notificationId });
  try {
    const data = await apiRequest<ApiNotification>(
      API_ENDPOINTS.notifications.markRead(notificationId),
      { method: 'PUT', token },
    );
    log.ok(SCOPE, 'Notification marked read', { notificationId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Mark read failed', getErrorMessage(error));
    throw error;
  }
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'PUT /notifications/mark-all-read');
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.notifications.markAllRead, {
      method: 'PUT',
      token,
    });
    log.ok(SCOPE, 'All notifications marked read');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Mark all read failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteNotification(
  token: string,
  notificationId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /notifications/:id', { notificationId });
  try {
    const data = await apiRequest<{ message: string }>(
      API_ENDPOINTS.notifications.byId(notificationId),
      { method: 'DELETE', token },
    );
    log.ok(SCOPE, 'Notification deleted', { notificationId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete notification failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchUnreadCount(token: string): Promise<{ unreadCount: number }> {
  log.info(SCOPE, 'GET /notifications/unread-count');
  try {
    const data = await apiRequest<{ unreadCount: number }>(
      '/notifications/unread-count',
      { token },
    );
    log.ok(SCOPE, 'Unread count fetched', data);
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Fetch unread count failed', getErrorMessage(error));
    throw error;
  }
}
