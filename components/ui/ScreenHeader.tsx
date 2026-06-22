import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { HeaderActionButtons } from './HeaderActionButtons';
import { HomeTheme, Spacing } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  notificationCount?: number;
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
  showJournal?: boolean;
}

export function ScreenHeader({
  title,
  notificationCount = 0,
  onJournalPress,
  onNotificationsPress,
  showJournal = true,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" weight="800" color={HomeTheme.text} style={styles.title}>
        {title}
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
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
  },
});
