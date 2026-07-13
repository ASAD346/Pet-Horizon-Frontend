import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../ui/AppText';
import { Spacing, Palette } from '../../../constants/theme';

export function LoginFooterBar() {
  return (
    <View style={styles.container}>
      <AppText variant="caption" color={Palette.gray[400]} align="center" weight="600">
        © All Rights Reserved to Pet Horizon - 2026
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Transparent background
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  versionText: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
});

