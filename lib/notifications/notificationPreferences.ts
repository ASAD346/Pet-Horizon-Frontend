import AsyncStorageStatic from '@react-native-async-storage/async-storage';
import { log } from '@/lib/log';

export interface NotificationPreferences {
  upcomingTasks: boolean;
  missedTasks: boolean;
  healthAlerts: boolean;
  dailyDigest: boolean;
  familyActivity: boolean;
  delegationAlerts: boolean;
  quietHours: boolean;
  criticalBypass: boolean;
}

export const NOTIFICATION_PREFERENCES_KEY = '@pet_horizon_notification_preferences_v2';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  upcomingTasks: true,
  missedTasks: true,
  healthAlerts: true,
  dailyDigest: true,
  familyActivity: true,
  delegationAlerts: true,
  quietHours: false,
  criticalBypass: true,
};

const SCOPE = 'NotifPrefs';

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorageStatic.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch (err) {
    log.warn(SCOPE, 'Error reading preferences, using defaults', err instanceof Error ? err.message : String(err));
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function saveNotificationPreferences(
  prefs: NotificationPreferences,
  token?: string | null,
  userId?: string | null
): Promise<void> {
  try {
    await AsyncStorageStatic.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(prefs));

    // Also sync to backend profile settings if logged in
    if (token && userId) {
      import('@/services/users/userApi')
        .then(({ updateUserProfile }) => {
          updateUserProfile(token, userId, {
            settings: {
              notificationPreferences: prefs,
            } as any,
          }).catch((err) => {
            log.warn(SCOPE, 'Failed to sync preferences to backend', err instanceof Error ? err.message : String(err));
          });
        })
        .catch(() => {});
    }
  } catch (err) {
    log.warn(SCOPE, 'Error saving preferences', err instanceof Error ? err.message : String(err));
  }
}

export interface NotificationAlertBehavior {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
  shouldShowBanner: boolean;
  shouldShowList: boolean;
}

/**
 * Evaluates whether an incoming notification should alert the user,
 * sound audibly, or be rendered silently according to user preferences & quiet hours.
 */
export function evaluateNotificationAlertBehavior(
  notification: any,
  prefs: NotificationPreferences
): NotificationAlertBehavior {
  const content = notification?.request?.content || notification;
  const data = content?.data || {};

  const type = String(data?.type || '').toLowerCase();
  const category = String(data?.category || '').toLowerCase();
  const title = String(content?.title || '').toLowerCase();
  const body = String(content?.body || '').toLowerCase();

  // 1. Check if category is completely disabled
  const isMissed = type === 'missed_task' || title.includes('missed') || body.includes('overdue');
  if (isMissed && !prefs.missedTasks) {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  }

  const isHealth =
    type === 'birthday' ||
    type === 'medical' ||
    type === 'vaccination' ||
    title.includes('birthday') ||
    title.includes('vaccin') ||
    title.includes('vet');
  if (isHealth && !prefs.healthAlerts) {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  }

  const isDigest =
    type === 'schedule_digest' ||
    title.includes('daily summary') ||
    title.includes('morning summary') ||
    title.includes('digest');
  if (isDigest && !prefs.dailyDigest) {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  }

  const isFamily = type === 'family' || type === 'family_activity' || title.includes('family');
  if (isFamily && !prefs.familyActivity) {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  }

  const isDelegation = type === 'delegation' || title.includes('delegat') || title.includes('assigned to you');
  if (isDelegation && !prefs.delegationAlerts) {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  }

  const isUpcoming =
    ['feeding', 'walk', 'food', 'grooming', 'grooming_due', 'general'].includes(type) ||
    title.includes('time to') ||
    title.includes('coming up') ||
    title.includes('scheduled');
  if (isUpcoming && !isMissed && !isHealth && !prefs.upcomingTasks) {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  }

  // 2. Check Quiet Hours (10:00 PM to 7:00 AM)
  if (prefs.quietHours) {
    const currentHour = new Date().getHours();
    const isQuietTime = currentHour >= 22 || currentHour < 7;

    if (isQuietTime) {
      const isUrgent =
        category === 'medication' ||
        type === 'medication' ||
        type === 'medical' ||
        title.includes('medication') ||
        title.includes('urgent');

      if (isUrgent && prefs.criticalBypass) {
        // Critical alert bypass: loud sound and visible alert
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      } else {
        // Routine notification during quiet hours: BECOMES SILENT!
        return {
          shouldShowAlert: true,
          shouldPlaySound: false, // NO SOUND! Silent notification
          shouldSetBadge: true,
          shouldShowBanner: false,
          shouldShowList: true,
        };
      }
    }
  }

  // Normal active notification with sound
  return {
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  };
}
