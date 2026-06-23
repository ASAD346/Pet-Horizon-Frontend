import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AppText } from '../ui/AppText';
import { HeaderActionButtons } from '../ui/HeaderActionButtons';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

interface HomeHeaderProps {
  userName?: string;
  dateLabel?: string;
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  showJournal?: boolean;
}

function getGreeting(userName: string): string {
  // new Date().getHours() retrieves the local hour of the user's device,
  // automatically adapting to their local timezone and country location.
  const hours = new Date().getHours();
  if (hours >= 5 && hours < 12) return `Good morning, ${userName}!`;
  if (hours >= 12 && hours < 17) return `Good afternoon, ${userName}!`;
  if (hours >= 17 && hours < 22) return `Good evening, ${userName}!`;
  return `Good night, ${userName}!`;
}

export function HomeHeader({
  userName = 'Sarah',
  dateLabel = 'Monday, May 15th',
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.greeting}>
          {getGreeting(userName)}
        </AppText>
        <AppText variant="bodySmall" color={HomeTheme.textMuted}>
          {dateLabel}
        </AppText>
      </View>

      <HeaderActionButtons
        notificationCount={notificationCount}
        onJournalPress={onJournalPress}
        onNotificationsPress={onNotificationsPress}
        showJournal={showJournal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  textBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  greeting: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 2,
  },
});
