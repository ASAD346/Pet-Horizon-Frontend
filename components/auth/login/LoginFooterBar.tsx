import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { AppText } from '../../ui/AppText';
import { Spacing, Palette } from '../../../constants/theme';

export function LoginFooterBar() {
  const insets = useSafeAreaInsets();
  const appVersion = Application.nativeApplicationVersion ?? '1.0.0';
  const buildVersion = Application.nativeBuildVersion ?? '1';

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <AppText variant="caption" color={Palette.gray[400]} align="center" weight="600">
        © All Rights Reserved to Pet Horizon - 2026
      </AppText>
      <AppText variant="caption" color={Palette.gray[400]} align="center" weight="500" style={styles.versionText}>
        v{appVersion} ({buildVersion})
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Transparent background
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  versionText: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
});

