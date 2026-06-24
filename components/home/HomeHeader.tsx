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
}

function getGreeting(userName: string): string {
  const hours = new Date().getHours();
  if (hours >= 5 && hours < 12) return `Morning, ${userName} ☀️`;
  if (hours >= 12 && hours < 17) return `Afternoon, ${userName} 🌤️`;
  if (hours >= 17 && hours < 22) return `Evening, ${userName} 🌆`;
  return `Night, ${userName} 🌙`;
}

export function HomeHeader({
  userName = 'there',
  dateLabel = 'Today',
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
  topInset = 0,
}: HomeHeaderProps) {
  const greeting = getGreeting(userName);
  const insets = useSafeAreaInsets();

  // Respect device safe area on left/right (notches, rounded corners)
  const safeLeft = Math.max(insets.left, Spacing.lg);
  const safeRight = Math.max(insets.right, Spacing.lg);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#3A8F3B', '#5CB35D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            paddingTop: topInset + 10,
            paddingLeft: safeLeft,
            paddingRight: safeRight,
          },
        ]}
      >
        {/* Single compact row */}
        <View style={styles.row}>
          {/* Left: greeting + date */}
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
            <View style={styles.dateLine}>
              <MaterialCommunityIcons name="calendar-today" size={10} color="rgba(255,255,255,0.7)" />
              <AppText
                variant="caption"
                weight="500"
                color="rgba(255,255,255,0.5)"
                style={styles.dateText}
                numberOfLines={1}
              >
                {'  '}{dateLabel}
              </AppText>
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

        {/* Ultra-thin accent rule */}
        <View style={styles.divider} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',   // fills screen width naturally — no negative margins
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B33',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  gradient: {
    // paddingTop / paddingLeft / paddingRight set inline
    paddingBottom: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  textBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
    gap: 3,
  },
  greetingText: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    lineHeight: 14,
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    opacity: 1,
  },
});
