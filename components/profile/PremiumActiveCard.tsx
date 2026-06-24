import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Radius, Spacing } from '@/constants/theme';
import { ProfileTheme } from './profileTheme';

interface PremiumActiveCardProps {
  planName?: string;
  expiresAt?: string;
}

export function PremiumActiveCard({ planName, expiresAt }: PremiumActiveCardProps) {
  const displayPlan = planName ? planName.toUpperCase() : 'PREMIUM MEMBER';
  const displayDate = expiresAt 
    ? new Date(expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : 'N/A';

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#FFFDF6', '#FFF4D0']} // Champagne/Soft Gold Gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="star" size={10} color="#FFFFFF" />
            <AppText variant="bodySmall" weight="800" color="#FFFFFF" style={styles.badgeText}>
              ACTIVE
            </AppText>
          </View>
          <Ionicons name="diamond" size={24} color="#D4A017" />
        </View>

        <AppText variant="h2" weight="800" color="#5C4212" style={styles.title}>
          {displayPlan}
        </AppText>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <AppText variant="caption" color="#8A7550" weight="700">
              RENEWAL DATE
            </AppText>
            <AppText variant="body" weight="800" color="#2C200B">
              {displayDate}
            </AppText>
          </View>
          <View style={styles.footerItemRight}>
            <AppText variant="caption" color="#8A7550" weight="700">
              BENEFITS
            </AppText>
            <AppText variant="body" weight="800" color="#1B5E20">
              Unlimited Access
            </AppText>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const bannerShadow = Platform.select({
  ios: {
    shadowColor: '#5C4212',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    ...bannerShadow,
  },
  banner: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#D4A017',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20', // Forest green for contrast
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 160, 23, 0.25)',
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    gap: 2,
  },
  footerItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
