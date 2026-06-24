import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { HeaderActionButtons } from '../ui/HeaderActionButtons';
import { Spacing } from '../../constants/theme';

interface ExpenseTrackerHeaderProps {
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  showJournal?: boolean;
  isPremium?: boolean;
  topInset?: number;
  selectedMonthLabel?: string;
  onDatePress?: () => void;
}

export function ExpenseTrackerHeader({
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
  isPremium = false,
  topInset = 0,
  selectedMonthLabel,
  onDatePress,
}: ExpenseTrackerHeaderProps) {
  const insets = useSafeAreaInsets();
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const displayMonth = selectedMonthLabel || currentMonthYear;

  // Mirror HomeHeader: premium = dark emerald, free = vibrant brand green
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';
  const safeLeft = Math.max(insets.left, Spacing.lg);
  const safeRight = Math.max(insets.right, Spacing.lg);

  return (
    <View style={[styles.wrapper, { shadowColor }]}>
      <View style={styles.curveClipper}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              paddingTop: topInset + 14,
              paddingLeft: safeLeft,
              paddingRight: safeRight,
            },
          ]}
        >
          {/* Decorative background rings */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.bgRing1} />
            <View style={styles.bgRing2} />
          </View>

          <View style={styles.row}>
            {/* Left: wallet icon badge + text */}
            <View style={styles.leftContainer}>
              <View style={[
                styles.iconOuterRing,
                isPremium && { borderColor: 'rgba(212, 160, 23, 0.45)' }
              ]}>
                <View style={styles.iconInnerContainer}>
                  <MaterialCommunityIcons name="wallet-outline" size={18} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.textBlock}>
                <AppText
                  variant="bodySmall"
                  weight="800"
                  color="#FFFFFF"
                  style={styles.title}
                  numberOfLines={1}
                >
                  Expense Tracker
                </AppText>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onDatePress}
                  style={[
                    styles.dateChip,
                    isPremium && {
                      borderColor: 'rgba(212, 160, 23, 0.35)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-today"
                    size={10}
                    color={isPremium ? '#FFF176' : '#FFFFFF'}
                  />
                  <AppText variant="caption" weight="800" color="#FFFFFF" style={styles.dateText}>
                    {'  '}{displayMonth}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right: notification / journal actions */}
            <HeaderActionButtons
              notificationCount={notificationCount}
              onJournalPress={onJournalPress}
              onNotificationsPress={onNotificationsPress}
              showJournal={showJournal}
              dark
            />
          </View>

          {/* Bottom accent line */}
          <View style={[
            styles.divider,
            isPremium && { backgroundColor: 'rgba(212, 160, 23, 0.3)' },
          ]} />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  curveClipper: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#F1F7F1',
  },
  gradient: {
    paddingBottom: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  bgRing1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  bgRing2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
    gap: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  dateText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
