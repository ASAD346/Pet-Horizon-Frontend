import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/constants/theme';

interface PremiumActiveCardProps {
  planName?: string;
  expiresAt?: string;
}

export function PremiumActiveCard({ planName, expiresAt }: PremiumActiveCardProps) {
  let displayPlan = 'PREMIUM MEMBER';
  if (planName) {
    const lower = planName.toLowerCase();
    if (lower.includes('yearly') || lower.includes('annual')) {
      displayPlan = 'Premium Yearly';
    } else if (lower.includes('monthly')) {
      displayPlan = 'Premium Monthly';
    } else if (lower === 'pethorizon_premium' || lower === 'premium') {
      displayPlan = 'PetHorizon Premium';
    } else {
      displayPlan = planName
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }

  const displayDate = expiresAt 
    ? new Date(expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : 'N/A';

  return (
    <View style={styles.wrapper}>
      <View style={styles.banner}>
        <View style={styles.mainRow}>
          <View style={styles.planCol}>
            <AppText variant="caption" color="rgba(255, 255, 255, 0.5)" weight="800" style={styles.label}>
              ACTIVE SUBSCRIPTION
            </AppText>
            <AppText variant="bodySmall" weight="800" color="#FFFFFF">
              {displayPlan}
            </AppText>
          </View>

          <View style={styles.infoCol}>
            <AppText variant="caption" color="rgba(255, 255, 255, 0.5)" weight="800" style={styles.label}>
              RENEWS
            </AppText>
            <AppText variant="bodySmall" weight="800" color="#FFD700">
              {displayDate}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  banner: {
    backgroundColor: '#0F2E1E', // Solid premium dark forest green
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)', // subtle bright gold border
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCol: {
    flexDirection: 'column',
    gap: 1,
  },
  infoCol: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
  },
  label: {
    fontSize: 8,
    letterSpacing: 0.6,
  },
});
