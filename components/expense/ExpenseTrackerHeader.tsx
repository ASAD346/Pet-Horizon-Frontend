import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { HeaderActionButtons } from '../ui/HeaderActionButtons';
import { HomeTheme, Spacing } from '../../constants/theme';

interface ExpenseTrackerHeaderProps {
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  showJournal?: boolean;
}

export function ExpenseTrackerHeader({
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
}: ExpenseTrackerHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.title}>
        Expense Tracker
      </AppText>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
  },
});
