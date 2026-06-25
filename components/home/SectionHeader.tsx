import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../ui/AppText';
import { HomeTheme, Spacing } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.title}>
        {title}
      </AppText>
      {actionLabel && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} hitSlop={8}>
          <AppText variant="bodySmall" weight="700" color={HomeTheme.green} style={styles.action}>
            {actionLabel}
          </AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 17,
  },
  action: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
