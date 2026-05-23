import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoginTheme, Spacing } from '../../constants/theme';

interface OrDividerProps {
  compact?: boolean;
}

export function OrDivider({ compact = false }: OrDividerProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.line} />
      <AppText variant="bodySmall" color={LoginTheme.tagline} style={styles.text}>
        or connect with
      </AppText>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: LoginTheme.dividerLine,
  },
  containerCompact: {
    marginVertical: Spacing.sm,
  },
  text: {
    paddingHorizontal: Spacing.xs,
  },
});
