import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { HeaderActionButtons } from '../ui/HeaderActionButtons';
import { Spacing } from '../../constants/theme';

interface HomeHeaderProps {
  userName?: string;
  dateLabel?: string;
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  showJournal?: boolean;
  /** Status bar height — header extends behind the status bar */
  topInset?: number;
  isPremium?: boolean;
}

function getGreeting(userName: string): string {
  const hours = new Date().getHours();
  const name = userName.trim();
  if (hours >= 5 && hours < 12) return `Good morning, ${name} 👋`;
  if (hours >= 12 && hours < 17) return `Good afternoon, ${name} 👋`;
  if (hours >= 17 && hours < 22) return `Good evening, ${name} 👋`;
  return `Hello, ${name} 👋`;
}

export function HomeHeader({
  userName = 'there',
  dateLabel = 'Today',
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
  topInset = 0,
  isPremium = false,
}: HomeHeaderProps) {
  const greeting = getGreeting(userName);
  const insets = useSafeAreaInsets();

  // Respect device safe area on left/right (notches, rounded corners)
  const safeLeft = Math.max(insets.left, Spacing.lg);
  const safeRight = Math.max(insets.right, Spacing.lg);

  // Extract initial for avatar badge
  const userInitial = userName.trim().charAt(0).toUpperCase();

  // Vibrant brand green for Free, luxurious dark emerald for Premium
  const gradientColors = isPremium
    ? (['#0E3821', '#184F2E', '#267343'] as const)
    : (['#3A8F3B', '#5CB35D'] as const);

  const shadowColor = isPremium ? '#082113' : '#1B5E20';

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
          {/* Single compact row with Double-Ring Avatar + Greeting Info + Actions */}
          <View style={styles.row}>
            <View style={styles.leftContainer}>
              {/* User Initial Double-Ring Avatar Badge */}
              <View style={[styles.avatarOuterRing, isPremium && { borderColor: 'rgba(212, 160, 23, 0.45)' }]}>
                <View style={styles.avatarInnerContainer}>
                  <AppText weight="800" style={styles.avatarText}>
                    {userInitial}
                  </AppText>
                </View>
              </View>

              {/* Left: greeting + date chip */}
              <View style={styles.textBlock}>
                <AppText
                  variant="bodySmall"
                  weight="800"
                  color="#FFFFFF"
                  style={styles.greetingText}
                  numberOfLines={1}
                >
                  {greeting}
                </AppText>
                <View style={[styles.dateChip, isPremium && { borderColor: 'rgba(212, 160, 23, 0.35)', backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                  <MaterialCommunityIcons name="calendar-today" size={10} color={isPremium ? '#FFF176' : '#FFFFFF'} />
                  <AppText
                    variant="caption"
                    weight="800"
                    color="#FFFFFF"
                    style={styles.dateText}
                    numberOfLines={1}
                  >
                    {'  '}{dateLabel}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Right: action buttons */}
            <HeaderActionButtons
              notificationCount={notificationCount}
              onJournalPress={onJournalPress}
              onNotificationsPress={onNotificationsPress}
              showJournal={showJournal}
              dark
            />
          </View>

          {/* Ultra-thin bottom accent line */}
          <View style={[styles.divider, isPremium && { backgroundColor: 'rgba(212, 160, 23, 0.3)' }]} />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',   // fills screen width naturally — no negative margins
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
    backgroundColor: '#FFF9F5', // Solid background color is required on Android to trigger border radius clipping on child views
  },
  gradient: {
    // paddingTop / paddingLeft / paddingRight set inline
    paddingBottom: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
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
  avatarOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
  },
  textBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
    gap: 1,
  },
  greetingText: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    opacity: 1,
  },
});
