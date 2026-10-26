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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Href } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { SafeModal } from '@/components/ui/SafeModal';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedRouter } from '@/hooks/useDebounce';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useToast } from '@/hooks/useToast';
import { isExpoGo } from '@/lib/runtime/isExpoGo';
import {
  getAppPermissionsStatus,
  requestNotificationPermission,
} from '@/lib/permissions/permissionsManager';

export interface NotificationPreferences {
  // Core Care
  upcomingTasks: boolean;
  missedTasks: boolean;
  healthAlerts: boolean;
  dailyDigest: boolean;

  // Family & Delegation
  familyActivity: boolean;
  delegationAlerts: boolean;

  // Pro Controls
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  criticalEscalation: boolean;
  vipChimes: boolean;
}

const PREFS_KEY = '@pet_horizon_notification_preferences_v2';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  upcomingTasks: true,
  missedTasks: true,
  healthAlerts: true,
  dailyDigest: false,
  familyActivity: true,
  delegationAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  criticalEscalation: true,
  vipChimes: true,
};

export default function NotificationSettingsScreen() {
  const router = useDebouncedRouter();
  const { token } = useAuth();
  const { isPremium } = usePremiumStatus();
  const { showSuccessToast, showErrorToast } = useToast();

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [checkingPerm, setCheckingPerm] = useState<boolean>(true);
  const [requestingPerm, setRequestingPerm] = useState<boolean>(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [proModalVisible, setProModalVisible] = useState<boolean>(false);
  const [selectedProFeature, setSelectedProFeature] = useState<string>('Quiet Hours');

  // Load status and stored preferences
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

  const handleProToggle = (featureName: string, key: keyof NotificationPreferences) => {
    if (!isPremium) {
      setSelectedProFeature(featureName);
      setProModalVisible(true);
      return;
    }
    void togglePref(key);
  };

  const handleEnablePermission = async () => {
    setRequestingPerm(true);
    try {
      const granted = await requestNotificationPermission(true);
      setHasPermission(granted);
      if (granted) {
        showSuccessToast('System notifications enabled successfully');
        if (token && !isExpoGo() && Platform.OS !== 'web') {
          import('@/lib/push/registerPushToken')
            .then(({ registerPushToken }) => registerPushToken(token))
            .catch(() => {});
        }
      } else {
        showErrorToast('Permission denied. Please enable notifications in your phone Settings.');
      }
    } catch {
      showErrorToast('Failed to request permission');
    } finally {
      setRequestingPerm(false);
    }
  };

  const headerGradient = isPremium
    ? (['#062314', '#0E3821', '#184F2E'] as const)
    : (['#1E5E2C', '#2E7D32', '#388E3C'] as const);

  const switchActiveColor = isPremium ? '#10B981' : '#2E7D32';

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <LinearGradient colors={headerGradient} style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <AppText variant="h3" weight="800" color="#FFFFFF">
                Notifications & Reminders
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.85)" style={styles.headerSubtitle}>
                {isPremium ? 'VIP precision alerts & quiet hours' : 'Personalized care schedule reminders'}
              </AppText>
            </View>

            <View
              style={[
                styles.tierBadge,
                isPremium ? styles.tierBadgePremium : styles.tierBadgeFree,
              ]}
            >
              <Ionicons
                name={isPremium ? 'sparkles' : 'shield-checkmark-outline'}
                size={12}
                color={isPremium ? '#FDE047' : '#DCFCE7'}
              />
              <AppText
                variant="caption"
                weight="800"
                color={isPremium ? '#FEF08A' : '#DCFCE7'}
                style={styles.tierText}
              >
                {isPremium ? 'PRO' : 'FREE'}
              </AppText>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Permission Master Status Card */}
        <View
          style={[
            styles.systemCard,
            hasPermission ? styles.systemCardActive : styles.systemCardDisabled,
          ]}
        >
          <View style={styles.systemCardHeader}>
            <View
              style={[
                styles.systemIconWrap,
                { backgroundColor: hasPermission ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.12)' },
              ]}
            >
              <Ionicons
                name={hasPermission ? 'notifications-sharp' : 'notifications-off'}
                size={22}
                color={hasPermission ? '#059669' : '#DC2626'}
              />
            </View>

            <View style={styles.systemTextWrap}>
              <View style={styles.systemTitleRow}>
                <AppText variant="body" weight="700" color="#0F172A">
                  Device Push Alerts
                </AppText>
                {hasPermission && (
                  <View style={styles.activePill}>
                    <View style={styles.pulseDot} />
                    <AppText variant="caption" weight="700" color="#059669">
                      Active
                    </AppText>
                  </View>
                )}
              </View>

              <AppText variant="caption" color="#64748B" style={styles.systemSubtitle}>
                {checkingPerm
                  ? 'Checking system notification permissions...'
                  : hasPermission
                  ? 'Registered for instant lock-screen pet care reminders.'
                  : 'Disabled. Scheduled feeding & medication alerts won’t pop up.'}
              </AppText>
            </View>
          </View>

          {!hasPermission && (
            <TouchableOpacity
              style={styles.enableBannerBtn}
              onPress={handleEnablePermission}
              disabled={requestingPerm}
              activeOpacity={0.85}
            >
              {requestingPerm ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <AppText variant="bodySmall" weight="700" color="#FFFFFF">
                    Enable System Notifications
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Section 1: Routine & Care Reminders */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodySmall" weight="800" color="#475569" style={styles.sectionHeaderTitle}>
            CARE & SCHEDULE REMINDERS
          </AppText>
          <AppText variant="caption" color="#94A3B8">
            Core Routine
          </AppText>
        </View>

        <View style={styles.cardGroup}>
          {/* Upcoming Tasks */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="alarm-outline" size={20} color="#2E7D32" />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="600" color="#0F172A">
                Upcoming Tasks
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Timely alerts for meals, walks, meds, and grooming
              </AppText>
            </View>
            <Switch
              value={prefs.upcomingTasks}
              onValueChange={() => togglePref('upcomingTasks')}
              trackColor={{ false: '#CBD5E1', true: isPremium ? '#6EE7B7' : '#81C784' }}
              thumbColor={prefs.upcomingTasks ? switchActiveColor : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Missed Tasks */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#EA580C" />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="600" color="#0F172A">
                Missed & Overdue Alerts
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Warning pings when a task is 30 mins overdue
              </AppText>
            </View>
            <Switch
              value={prefs.missedTasks}
              onValueChange={() => togglePref('missedTasks')}
              trackColor={{ false: '#CBD5E1', true: isPremium ? '#6EE7B7' : '#81C784' }}
              thumbColor={prefs.missedTasks ? switchActiveColor : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Health & Milestones */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="medkit-outline" size={20} color="#DB2777" />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="600" color="#0F172A">
                Health & Milestones
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Vaccine due dates, vet checkups, and pet birthdays
              </AppText>
            </View>
            <Switch
              value={prefs.healthAlerts}
              onValueChange={() => togglePref('healthAlerts')}
              trackColor={{ false: '#CBD5E1', true: isPremium ? '#6EE7B7' : '#81C784' }}
              thumbColor={prefs.healthAlerts ? switchActiveColor : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Daily Care Digest */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="sunny-outline" size={20} color="#0284C7" />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="600" color="#0F172A">
                Morning Care Digest
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                8:00 AM summary of your pet’s daily schedule
              </AppText>
            </View>
            <Switch
              value={prefs.dailyDigest}
              onValueChange={() => togglePref('dailyDigest')}
              trackColor={{ false: '#CBD5E1', true: isPremium ? '#6EE7B7' : '#81C784' }}
              thumbColor={prefs.dailyDigest ? switchActiveColor : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Section 2: Family & Collaboration */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodySmall" weight="800" color="#475569" style={styles.sectionHeaderTitle}>
            FAMILY & CAREGIVER SYNC
          </AppText>
          <AppText variant="caption" color="#94A3B8">
            Co-parenting
          </AppText>
        </View>

        <View style={styles.cardGroup}>
          {/* Family Activity */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="600" color="#0F172A">
                Family Activity Feed
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Notifies when family members feed or log a walk
              </AppText>
            </View>
            <Switch
              value={prefs.familyActivity}
              onValueChange={() => togglePref('familyActivity')}
              trackColor={{ false: '#CBD5E1', true: isPremium ? '#6EE7B7' : '#81C784' }}
              thumbColor={prefs.familyActivity ? switchActiveColor : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Delegation Alerts */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="git-pull-request-outline" size={20} color="#7C3AED" />
            </View>
            <View style={styles.rowText}>
              <AppText variant="body" weight="600" color="#0F172A">
                Delegated Tasks
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Alerts when a co-parent assigns a task to you
              </AppText>
            </View>
            <Switch
              value={prefs.delegationAlerts}
              onValueChange={() => togglePref('delegationAlerts')}
              trackColor={{ false: '#CBD5E1', true: isPremium ? '#6EE7B7' : '#81C784' }}
              thumbColor={prefs.delegationAlerts ? switchActiveColor : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Section 3: Exclusive Pro Care Suite */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderRow}>
            <AppText variant="bodySmall" weight="800" color="#B45309" style={styles.sectionHeaderTitle}>
              GOLD SUITE ADVANCED CONTROLS
            </AppText>
            <View style={styles.proSmallPill}>
              <AppText variant="caption" weight="800" color="#B45309">
                PRO ONLY
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color={isPremium ? '#059669' : '#D97706'} weight="600">
            {isPremium ? 'Unlocked for your account' : 'Tap to unlock'}
          </AppText>
        </View>

        <View style={[styles.cardGroup, styles.proCardGroup, isPremium && styles.proCardGroupUnlocked]}>
          {/* Pro Banner Header inside the card */}
          <LinearGradient
            colors={
              isPremium
                ? ['rgba(16, 185, 129, 0.12)', 'rgba(6, 78, 59, 0.05)']
                : ['rgba(245, 158, 11, 0.15)', 'rgba(217, 119, 6, 0.05)']
            }
            style={styles.proBannerInside}
          >
            <Ionicons
              name={isPremium ? 'shield-checkmark' : 'sparkles'}
              size={18}
              color={isPremium ? '#059669' : '#D97706'}
            />
            <AppText
              variant="caption"
              weight="700"
              color={isPremium ? '#065F46' : '#92400E'}
              style={{ marginLeft: 6, flex: 1 }}
            >
              {isPremium
                ? 'Precision care rules active — Enjoy VIP sleep mode and critical escalation.'
                : 'Unlock Quiet Hours sleep mode and multi-caregiver alert escalation.'}
            </AppText>
            {!isPremium && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedProFeature('Pet Horizon Gold Care Suite');
                  setProModalVisible(true);
                }}
                style={styles.unlockSmallBtn}
                activeOpacity={0.8}
              >
                <AppText variant="caption" weight="800" color="#FFFFFF">
                  Upgrade
                </AppText>
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* Quiet Hours */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={isPremium ? 1 : 0.7}
            onPress={() => handleProToggle('Quiet Hours Sleep Mode', 'quietHoursEnabled')}
          >
            <View style={[styles.iconBox, { backgroundColor: isPremium ? '#ECFDF5' : '#FEF3C7' }]}>
              <Ionicons
                name="moon"
                size={20}
                color={isPremium ? '#059669' : '#D97706'}
              />
            </View>
            <View style={styles.rowText}>
              <View style={styles.proRowTitle}>
                <AppText variant="body" weight="600" color="#0F172A">
                  Quiet Hours (Sleep Mode)
                </AppText>
                {!isPremium && <Ionicons name="lock-closed" size={14} color="#D97706" style={{ marginLeft: 6 }} />}
              </View>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Silences routine chimes from 10:00 PM to 7:00 AM (urgent meds still alert)
              </AppText>
            </View>
            <Switch
              value={isPremium ? prefs.quietHoursEnabled : false}
              onValueChange={() => handleProToggle('Quiet Hours Sleep Mode', 'quietHoursEnabled')}
              trackColor={{ false: '#CBD5E1', true: '#6EE7B7' }}
              thumbColor={prefs.quietHoursEnabled && isPremium ? '#059669' : '#FFFFFF'}
              disabled={!isPremium}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Critical Escalation */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={isPremium ? 1 : 0.7}
            onPress={() => handleProToggle('Urgent Escalation', 'criticalEscalation')}
          >
            <View style={[styles.iconBox, { backgroundColor: isPremium ? '#ECFDF5' : '#FEF3C7' }]}>
              <Ionicons
                name="flash"
                size={20}
                color={isPremium ? '#059669' : '#D97706'}
              />
            </View>
            <View style={styles.rowText}>
              <View style={styles.proRowTitle}>
                <AppText variant="body" weight="600" color="#0F172A">
                  Critical Task Escalation
                </AppText>
                {!isPremium && <Ionicons name="lock-closed" size={14} color="#D97706" style={{ marginLeft: 6 }} />}
              </View>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Alerts backup caregivers if urgent medication is 45m uncompleted
              </AppText>
            </View>
            <Switch
              value={isPremium ? prefs.criticalEscalation : false}
              onValueChange={() => handleProToggle('Urgent Escalation', 'criticalEscalation')}
              trackColor={{ false: '#CBD5E1', true: '#6EE7B7' }}
              thumbColor={prefs.criticalEscalation && isPremium ? '#059669' : '#FFFFFF'}
              disabled={!isPremium}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* VIP Priority Chimes */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={isPremium ? 1 : 0.7}
            onPress={() => handleProToggle('Custom Chimes', 'vipChimes')}
          >
            <View style={[styles.iconBox, { backgroundColor: isPremium ? '#ECFDF5' : '#FEF3C7' }]}>
              <Ionicons
                name="volume-high"
                size={20}
                color={isPremium ? '#059669' : '#D97706'}
              />
            </View>
            <View style={styles.rowText}>
              <View style={styles.proRowTitle}>
                <AppText variant="body" weight="600" color="#0F172A">
                  High-Priority Pet Chime
                </AppText>
                {!isPremium && <Ionicons name="lock-closed" size={14} color="#D97706" style={{ marginLeft: 6 }} />}
              </View>
              <AppText variant="caption" color="#64748B" style={styles.rowDesc}>
                Custom sound patterns that cut through noisy environments
              </AppText>
            </View>
            <Switch
              value={isPremium ? prefs.vipChimes : false}
              onValueChange={() => handleProToggle('Custom Chimes', 'vipChimes')}
              trackColor={{ false: '#CBD5E1', true: '#6EE7B7' }}
              thumbColor={prefs.vipChimes && isPremium ? '#059669' : '#FFFFFF'}
              disabled={!isPremium}
            />
          </TouchableOpacity>
        </View>

        {/* Anti-Spam Guarantee Card */}
        <View style={styles.guaranteeBox}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" style={{ marginTop: 2, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodySmall" weight="700" color="#0F172A">
              Zero-Spam Notification Policy
            </AppText>
            <AppText variant="caption" color="#64748B" style={{ marginTop: 2, lineHeight: 16 }}>
              Pet Horizon only delivers scheduled care prompts and family coordination pings. You will never receive marketing spam or duplicate alerts for actions you log yourself.
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Pro Perk Modal */}
      <SafeModal
        visible={proModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} onTouchEnd={() => setProModalVisible(false)} />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#062314', '#0E3821', '#184F2E']}
              style={styles.modalGradientHeader}
            >
              <View style={styles.modalCrownWrap}>
                <Ionicons name="sparkles" size={26} color="#FDE047" />
              </View>
              <AppText variant="h3" weight="800" color="#FFFFFF" style={{ textAlign: 'center' }}>
                Unlock Gold Precision Care
              </AppText>
              <AppText variant="caption" color="#FEF08A" style={{ marginTop: 4, textAlign: 'center' }}>
                {selectedProFeature} requires Pet Horizon Pro
              </AppText>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                <AppText variant="bodySmall" color="#334155" style={{ flex: 1 }}>
                  <AppText weight="700" color="#0F172A">Smart Quiet Hours: </AppText>
                  Mute routine pings at night while keeping medical emergencies audible.
                </AppText>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                <AppText variant="bodySmall" color="#334155" style={{ flex: 1 }}>
                  <AppText weight="700" color="#0F172A">Critical Escalation: </AppText>
                  Auto-alert secondary caregivers when vital meds or feeds are missed.
                </AppText>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                <AppText variant="bodySmall" color="#334155" style={{ flex: 1 }}>
                  <AppText weight="700" color="#0F172A">Unlimited Co-Parent Sync: </AppText>
                  Live coordination across the whole family with instant push alerts.
                </AppText>
              </View>

              <TouchableOpacity
                style={styles.modalUpgradeBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setProModalVisible(false);
                  router.navigate('/profile/billing' as Href);
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.modalBtnGradient}
                >
                  <AppText variant="body" weight="800" color="#FFFFFF">
                    Explore Premium Plans
                  </AppText>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setProModalVisible(false)}
              >
                <AppText variant="bodySmall" weight="600" color="#64748B">
                  Maybe Later
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  safeHeader: {
    paddingHorizontal: Spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tierBadgeFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tierBadgePremium: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderColor: 'rgba(245, 158, 11, 0.6)',
  },
  tierText: {
    marginLeft: 4,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
  },
  systemCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  systemCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1FAE5',
  },
  systemCardDisabled: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  systemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  systemTextWrap: {
    flex: 1,
  },
  systemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 4,
  },
  systemSubtitle: {
    marginTop: 2,
    lineHeight: 16,
  },
  enableBannerBtn: {
    marginTop: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs + 2,
    paddingHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    letterSpacing: 0.6,
  },
  proSmallPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginLeft: 6,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  proCardGroup: {
    borderColor: '#FDE68A',
  },
  proCardGroupUnlocked: {
    borderColor: '#A7F3D0',
  },
  proBannerInside: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  unlockSmallBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  rowText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  proRowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: Spacing.md + 46,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalGradientHeader: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  modalCrownWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm + 2,
  },
  modalUpgradeBtn: {
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalDismissBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    marginTop: 4,
  },
});
