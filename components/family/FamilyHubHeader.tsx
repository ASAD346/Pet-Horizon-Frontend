import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { HeaderActionButtons } from '@/components/ui/HeaderActionButtons';
import { HomeTheme, Spacing } from '@/constants/theme';

interface FamilyHubHeaderProps {
  notificationCount?: number;
  onNotificationsPress?: () => void;
}

export function FamilyHubHeader({
  notificationCount = 0,
  onNotificationsPress,
}: FamilyHubHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <AppText variant="caption" weight="700" color={HomeTheme.textMuted} style={styles.eyebrow}>
          COLLABORATE
        </AppText>
        <AppText variant="h3" weight="800" color={HomeTheme.text}>
          Family Hub
        </AppText>
      </View>
      <HeaderActionButtons
        notificationCount={notificationCount}
        onNotificationsPress={onNotificationsPress}
        showJournal={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  eyebrow: {
    letterSpacing: 1,
    marginBottom: 2,
  },
});
