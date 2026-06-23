import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AuthLogoMark } from '../AuthLogoMark';
import { Palette, Spacing } from '../../../constants/theme';

interface LoginBrandingProps {
  compact?: boolean;
}

export function LoginBranding({ compact = false }: LoginBrandingProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Centered logo icon */}
      <AuthLogoMark size={compact ? 'compact' : 'default'} style={styles.logoMark} />

      {/* Modern High-Contrast Geometric Wordmark */}
      <View style={styles.titleRow}>
        <AppText style={[styles.brandPet, compact && styles.brandPetCompact]}>
          Pet
        </AppText>
        <AppText style={[styles.brandHorizon, compact && styles.brandHorizonCompact]}>
          Horizon
        </AppText>
      </View>

      {/* New Slogan */}
      <AppText
        variant="caption"
        color={Palette.gray[600]}
        align="center"
        style={styles.tagline}
        weight="700"
      >
        Where every paw finds its path.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
    width: '100%',
  },
  containerCompact: {
    paddingTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  logoMark: {
    marginBottom: Spacing.xs,
    transform: [{ scale: 0.85 }],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPet: {
    fontSize: 28,
    fontWeight: '300',
    color: '#5CB35D',  // Brand Green
    letterSpacing: -0.5,
  },
  brandHorizon: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2B4E',  // Deep Navy
    letterSpacing: -0.5,
  },
  brandPetCompact: {
    fontSize: 24,
  },
  brandHorizonCompact: {
    fontSize: 24,
  },
  tagline: {
    fontSize: 13,
    marginTop: 6,
    color: '#0B3B29', // Matching the dark logo brand text tone
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});
