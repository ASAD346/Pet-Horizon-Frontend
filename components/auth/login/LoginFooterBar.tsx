import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../ui/AppText';
import { LoginTheme, Spacing } from '../../../constants/theme';

export function LoginFooterBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <AppText variant="caption" color={LoginTheme.footerText} align="center">
        © All Rights Reserved to Pet Horizon - 2026
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LoginTheme.green,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
