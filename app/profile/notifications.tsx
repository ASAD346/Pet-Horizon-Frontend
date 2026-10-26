import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppText } from '@/components/ui/AppText';
import { ProfileScreenHeader } from '@/components/profile/ProfileScreenHeader';
import { ProfileTheme } from '@/components/profile/profileTheme';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import {
  getAppPermissionsStatus,
  requestNotificationPermission,
} from '@/lib/permissions/permissionsManager';

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

const PREFS_KEY = '@pet_horizon_notification_preferences_v2';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  upcomingTasks: true,
  missedTasks: true,
  healthAlerts: true,
  dailyDigest: true,
  familyActivity: true,
  delegationAlerts: true,
  quietHours: false,
  criticalBypass: true,
};

export default function NotificationSettingsScreen() {
  const router = useDebouncedRouter();
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
    void checkStatus();
    void loadPrefs();
  }, [checkStatus, loadPrefs]);

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
        showErrorToast('Permission not granted. Please enable in phone Settings.');
      }
    } catch {
      showErrorToast('Failed to request permission');
    } finally {
      setRequestingPerm(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Standard Profile Header */}
      <ProfileScreenHeader
        title="Notifications & Reminders"
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status Header Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIconWrap,
                { backgroundColor: hasPermission ? 'rgba(46, 125, 50, 0.1)' : 'rgba(230, 81, 0, 0.1)' },
              ]}
            >
              <Ionicons
                name={hasPermission ? 'notifications' : 'notifications-off-outline'}
                size={20}
                color={hasPermission ? '#2E7D32' : '#E65100'}
              />
            </View>

            <View style={styles.statusTextWrap}>
              <AppText variant="body" weight="700" color="#0E3821">
                Push Notifications
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.statusSubtitle}>
                {checkingPerm
                  ? 'Checking system status...'
                  : hasPermission
                  ? 'Active · Device registered for care alerts'
                  : 'Disabled · Reminders won’t appear on lockscreen'}
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

        {/* Section 1: Care & Routine */}
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionTitle}>
          CARE & ROUTINE REMINDERS
        </AppText>

        <View style={styles.card}>
          {/* Upcoming Tasks */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(46, 125, 50, 0.08)' }]}>
              <Ionicons name="alarm-outline" size={18} color="#2E7D32" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Upcoming Tasks
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
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

          {/* Missed Tasks */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(230, 81, 0, 0.08)' }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#E65100" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Missed Tasks
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
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

          {/* Health & Milestones */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(194, 24, 91, 0.08)' }]}>
              <Ionicons name="medkit-outline" size={18} color="#C2185B" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Health & Milestones
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
                Vaccinations due, vet appointments, and pet birthdays
              </AppText>
            </View>
            <Switch
              value={prefs.healthAlerts}
              onValueChange={() => togglePref('healthAlerts')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.healthAlerts ? '#2E7D32' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Daily Summary */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.08)' }]}>
              <Ionicons name="sunny-outline" size={18} color="#0284C7" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Daily Summary
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
                Morning overview of today’s scheduled routine for all pets
              </AppText>
            </View>
            <Switch
              value={prefs.dailyDigest}
              onValueChange={() => togglePref('dailyDigest')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.dailyDigest ? '#2E7D32' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Section 2: Family & Collaboration */}
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionTitle}>
          FAMILY & CAREGIVERS
        </AppText>

        <View style={styles.card}>
          {/* Family Activity */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(21, 101, 192, 0.08)' }]}>
              <Ionicons name="people-outline" size={18} color="#1565C0" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Family Activity
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
                Notify when family members complete a task or log a walk
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

          {/* Delegation Alerts */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(124, 58, 237, 0.08)' }]}>
              <Ionicons name="git-pull-request-outline" size={18} color="#7C3AED" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Task Delegation
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
                Alert when a co-parent assigns or reassigns a task to you
              </AppText>
            </View>
            <Switch
              value={prefs.delegationAlerts}
              onValueChange={() => togglePref('delegationAlerts')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.delegationAlerts ? '#2E7D32' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Section 3: Quiet Hours & Schedule Preferences */}
        <AppText variant="caption" weight="700" color="#64748B" style={styles.sectionTitle}>
          PREFERENCES
        </AppText>

        <View style={styles.card}>
          {/* Quiet Hours */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(71, 85, 105, 0.08)' }]}>
              <Ionicons name="moon-outline" size={18} color="#475569" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Quiet Hours
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
                Mute routine notification alerts between 10:00 PM and 7:00 AM
              </AppText>
            </View>
            <Switch
              value={prefs.quietHours}
              onValueChange={() => togglePref('quietHours')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.quietHours ? '#2E7D32' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Critical Bypass */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(220, 38, 38, 0.08)' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#DC2626" />
            </View>
            <View style={styles.infoWrap}>
              <AppText variant="body" weight="600" color="#0E3821">
                Urgent Medical Bypass
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.desc}>
                Always sound critical medication reminders even during Quiet Hours
              </AppText>
            </View>
            <Switch
              value={prefs.criticalBypass}
              onValueChange={() => togglePref('criticalBypass')}
              trackColor={{ false: '#E2E8F0', true: '#81C784' }}
              thumbColor={prefs.criticalBypass ? '#2E7D32' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Note Box */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
          <AppText variant="caption" color="#64748B" style={styles.noteText}>
            Pet Horizon only sends relevant alerts. You will never receive notifications for actions you complete yourself.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProfileTheme.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl + 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusSubtitle: {
    marginTop: 2,
    lineHeight: 16,
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
    marginBottom: Spacing.xs + 2,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#0E3821',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  infoWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  desc: {
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: Spacing.md + 44,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  noteText: {
    flex: 1,
    lineHeight: 16,
  },
});
