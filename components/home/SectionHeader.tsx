import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText } from '../ui/AppText';
import { HomeTheme, Spacing } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  showLoading?: boolean;
}

export function SectionHeader({ title, actionLabel, onActionPress, showLoading }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.title}>
          {title}
        </AppText>
        {showLoading && (
          <ActivityIndicator size="small" color={HomeTheme.green} style={{ opacity: 0.8 }} />
        )}
      </View>
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
