import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Switch, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileModalShell } from './ProfileModalShell';
import { ProfileTheme } from './profileTheme';
import { getAppPermissionsStatus, requestNotificationPermission } from '@/lib/permissions/permissionsManager';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { isExpoGo } from '@/lib/runtime/isExpoGo';

interface NotificationSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export interface NotificationPreferences {
  upcomingTasks: boolean;
  missedTasks: boolean;
  familyActivity: boolean;
  healthAlerts: boolean;
}

const PREFS_KEY = '@pet_horizon_notification_preferences_v1';

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  upcomingTasks: true,
  missedTasks: true,
  familyActivity: true,
  healthAlerts: true,
};

export function NotificationSettingsSheet({ visible, onClose }: NotificationSettingsSheetProps) {
  const { token } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [checkingPerm, setCheckingPerm] = useState<boolean>(true);
  const [requestingPerm, setRequestingPerm] = useState<boolean>(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const checkStatus = useCallback(async () => {
    try {
      const summary = await getAppPermissionsStatus();
      setHasPermission(summary.notifications);
    } catch {
      setHasPermission(false);
    } finally {
      setCheckingPerm(false);
    }
  }, []);

  const loadPrefs = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(PREFS_KEY);
      if (saved) {
        setPrefs({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setCheckingPerm(true);
      void checkStatus();
      void loadPrefs();
    }
  }, [visible, checkStatus, loadPrefs]);

  const togglePref = async (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleEnablePermission = async () => {
    setRequestingPerm(true);
    try {
      const granted = await requestNotificationPermission(true);
      setHasPermission(granted);
      if (granted) {
        showSuccessToast('Notifications enabled successfully');
        if (token && !isExpoGo() && Platform.OS !== 'web') {
          import('@/lib/push/registerPushToken')
            .then(({ registerPushToken }) => registerPushToken(token))
            .catch(() => {});
        }
      } else {
        showErrorToast('Notification permission not granted. You can enable it in phone Settings.');
      }
    } catch (e) {
      showErrorToast('Failed to request permission');
    } finally {
      setRequestingPerm(false);
    }
  };

  return (
    <ProfileModalShell visible={visible} onClose={onClose} title="Notifications & Reminders">
      <View style={styles.content}>
        {/* Permission Status Header Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIconWrap,
                { backgroundColor: hasPermission ? 'rgba(46, 125, 50, 0.12)' : 'rgba(230, 81, 0, 0.12)' },
              ]}
            >
              <Ionicons
                name={hasPermission ? 'notifications' : 'notifications-off-outline'}
                size={22}
                color={hasPermission ? '#2E7D32' : '#E65100'}
              />
            </View>
            <View style={styles.statusTextWrap}>
              <AppText variant="body" weight="700" color="#1E293B">
                Push Notifications
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.statusSubtitle}>
                {checkingPerm
                  ? 'Checking system status...'
                  : hasPermission
                  ? 'Active · Device registered for care alerts'
                  : 'Disabled · Care reminders won’t pop up'}
              </AppText>
            </View>

            {checkingPerm ? (
              <ActivityIndicator size="small" color="#2E7D32" />
            ) : hasPermission ? (
              <View style={styles.grantedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <AppText variant="caption" weight="700" color="#2E7D32" style={{ marginLeft: 3 }}>
                  Active
                </AppText>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={handleEnablePermission}
                disabled={requestingPerm}
                activeOpacity={0.8}
              >
                {requestingPerm ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText variant="caption" weight="700" color="#FFFFFF">
                    Enable
                  </AppText>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <AppText variant="bodySmall" weight="700" color="#64748B" style={styles.sectionTitle}>
          CARE & FAMILY PREFERENCES
        </AppText>

        <View style={styles.prefGroup}>
          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <View style={styles.prefIconLabel}>
                <Ionicons name="alarm-outline" size={18} color="#2E7D32" style={styles.iconMargin} />
                <AppText variant="body" weight="600" color="#1E293B">
                  Upcoming Tasks
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={styles.prefDesc}>
                Reminders when meals, walks, meds, or grooming are scheduled
              </AppText>
            </View>
            <Switch
              value={prefs.upcomingTasks}
              onValueChange={() => togglePref('upcomingTasks')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.upcomingTasks ? '#2E7D32' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <View style={styles.prefIconLabel}>
                <Ionicons name="alert-circle-outline" size={18} color="#E65100" style={styles.iconMargin} />
                <AppText variant="body" weight="600" color="#1E293B">
                  Missed Tasks
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={styles.prefDesc}>
                Alert when a scheduled task is 30 mins overdue and uncompleted
              </AppText>
            </View>
            <Switch
              value={prefs.missedTasks}
              onValueChange={() => togglePref('missedTasks')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.missedTasks ? '#2E7D32' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <View style={styles.prefIconLabel}>
                <Ionicons name="people-outline" size={18} color="#1565C0" style={styles.iconMargin} />
                <AppText variant="body" weight="600" color="#1E293B">
                  Family Activity
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={styles.prefDesc}>
                Notify when family members complete a task or start a walk
              </AppText>
            </View>
            <Switch
              value={prefs.familyActivity}
              onValueChange={() => togglePref('familyActivity')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.familyActivity ? '#2E7D32' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <View style={styles.prefIconLabel}>
                <Ionicons name="medkit-outline" size={18} color="#C2185B" style={styles.iconMargin} />
                <AppText variant="body" weight="600" color="#1E293B">
                  Health & Milestones
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={styles.prefDesc}>
                Vaccinations due, birthdays, and critical medical alerts
              </AppText>
            </View>
            <Switch
              value={prefs.healthAlerts}
              onValueChange={() => togglePref('healthAlerts')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.healthAlerts ? '#2E7D32' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
          <AppText variant="caption" color="#64748B" style={{ flex: 1 }}>
            Pet Horizon only sends relevant alerts. You will never receive notifications for actions you complete yourself.
          </AppText>
        </View>
      </View>
    </ProfileModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  statusCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusSubtitle: {
    marginTop: 2,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  enableButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.md,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  prefGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  prefInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  prefIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 6,
  },
  prefDesc: {
    marginTop: 2,
    marginLeft: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: Spacing.md + 24,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.lg,
  },
});
