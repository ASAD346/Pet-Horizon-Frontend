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
          Good morning, {userName}!
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
