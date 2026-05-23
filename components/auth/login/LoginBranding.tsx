import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { LoginTheme, Spacing } from '../../../constants/theme';

const PETS = [
  { icon: 'dog' as const, label: 'DOG' },
  { icon: 'cat' as const, label: 'CAT' },
  { icon: 'rabbit' as const, label: 'RABBIT' },
  { icon: 'bird' as const, label: 'BIRD' },
];

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

interface LoginBrandingProps {
  compact?: boolean;
}

export function LoginBranding({ compact = false }: LoginBrandingProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={[styles.logo, compact && styles.logoCompact]}
        contentFit="contain"
      />

      <View style={styles.titleRow}>
        <AppText style={[styles.brandPet, compact && styles.brandPetCompact, { fontFamily: serifFont }]}>
          Pet{' '}
        </AppText>
        <AppText style={[styles.brandHorizon, compact && styles.brandHorizonCompact, { fontFamily: serifFont }]}>
          Horizon
        </AppText>
      </View>

      <AppText
        variant="bodySmall"
        color={LoginTheme.tagline}
        align="center"
        style={[styles.tagline, compact && styles.taglineCompact]}
      >
        Your Pet&apos;s World, All in One Place
      </AppText>

      <View style={[styles.pawRow, compact && styles.pawRowCompact]}>
        <MaterialCommunityIcons name="paw" size={compact ? 12 : 14} color={LoginTheme.green} />
      </View>

      <View style={[styles.petIconsRow, compact && styles.petIconsRowCompact]}>
        {PETS.map((pet) => (
          <View key={pet.label} style={styles.petItem}>
            <View style={[styles.petIconCircle, compact && styles.petIconCircleCompact]}>
              <MaterialCommunityIcons name={pet.icon} size={compact ? 14 : 16} color={LoginTheme.charcoal} />
            </View>
            <AppText variant="caption" color={LoginTheme.petLabel} style={styles.petLabel}>
              {pet.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  containerCompact: {
    paddingTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: Spacing.sm,
  },
  logoCompact: {
    width: 68,
    height: 68,
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  brandPet: {
    fontSize: 22,
    fontWeight: '400',
    color: LoginTheme.brandPet,
  },
  brandHorizon: {
    fontSize: 22,
    fontWeight: '700',
    color: LoginTheme.brandHorizon,
  },
  brandPetCompact: {
    fontSize: 20,
  },
  brandHorizonCompact: {
    fontSize: 20,
  },
  tagline: {
    marginBottom: Spacing.sm,
    fontSize: 13,
  },
  taglineCompact: {
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  pawRow: {
    marginBottom: Spacing.sm,
  },
  pawRowCompact: {
    marginBottom: Spacing.xs,
  },
  petIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  petIconsRowCompact: {
    gap: Spacing.sm,
  },
  petItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  petIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petIconCircleCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  petLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
