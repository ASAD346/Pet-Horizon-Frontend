import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Skeleton } from '@/components/ui/skeletons';
import { Radius, Spacing } from '../../constants/theme';

// Free plan: vibrant brand green (matches HomeHeader free gradient)
const FREE_GRAD: readonly [string, string] = ['#3A8F3B', '#5CB35D'];
const FREE_SHADOW = '#1B5E20';

// Premium plan: dark luxurious emerald (matches HomeHeader premium gradient)
const PREM_GRAD: readonly [string, string, string] = ['#0E3821', '#184F2E', '#267343'];
const PREM_SHADOW = '#082113';

interface WeeklySpendingCardProps {
  periodLabel: string;
  limitLabel: string;
  spentPercent: number;
  remainingLabel: string;
  status: string;
  hasBudget?: boolean;
  loading?: boolean;
  isPremium?: boolean;
  onEditPress?: (isNew?: boolean) => void;
  periodStart?: string;
  periodEnd?: string;
}

export function WeeklySpendingCard({
  periodLabel,
  limitLabel,
  spentPercent,
  remainingLabel,
  status,
  hasBudget = false,
  loading,
  isPremium = false,
  onEditPress,
  periodStart,
  periodEnd,
}: WeeklySpendingCardProps) {
  const isOver = status === 'Over budget';
  const clampedPercent = Math.min(Number(spentPercent) || 0, 100);

  const gradientColors = isPremium ? PREM_GRAD : FREE_GRAD;
  const shadowColor = isPremium ? PREM_SHADOW : FREE_SHADOW;

  // Premium uses gold accent for the chip border and progress bar
  const progressColor = isOver ? '#EF9A9A' : (isPremium ? '#FFF176' : '#A5D6A7');

  const isExpired = periodEnd ? new Date(periodEnd).getTime() < Date.now() : false;

  let editButtonLabel = 'Edit Budget';
  if (isExpired) {
    editButtonLabel = 'Add New';
  } else if (isOver) {
    editButtonLabel = 'New Budget';
  }

  const formattedEnd = periodEnd
    ? new Date(periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <View style={[styles.wrapper, { shadowColor }]}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative rings */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.bgRing1} />
          <View style={styles.bgRing2} />
        </View>

        {/* Top Row: period label + status badge */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <AppText variant="bodySmall" weight="700" color="rgba(255,255,255,0.85)">
              {periodLabel}
            </AppText>
          </View>
          {hasBudget ? (
            <View style={[styles.statusBadge, isOver && styles.statusOver]}>
              <Ionicons
                name={isOver ? 'alert-circle' : 'checkmark-circle'}
                size={13}
                color={isOver ? '#FFCDD2' : '#C8E6C9'}
              />
              <AppText variant="caption" weight="800" color={isOver ? '#FFCDD2' : '#C8E6C9'}>
                {status}
              </AppText>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.skeletonBody}>
            <Skeleton width="55%" height={36} tone="dark" />
            <Skeleton width="100%" height={8} borderRadius={4} tone="dark" style={styles.skeletonGap} />
            <View style={styles.bottomRow}>
              <Skeleton width="45%" height={12} tone="dark" />
              <Skeleton width={88} height={28} borderRadius={Radius.full} tone="dark" />
            </View>
          </View>
        ) : (
          <>
            {/* Big budget amount */}
            <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.limitAmount}>
              {limitLabel}
            </AppText>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              {hasBudget ? (
                <View
                  style={[
                    styles.progressFill,
                    { width: `${clampedPercent}%`, backgroundColor: progressColor },
                  ]}
                />
              ) : null}
            </View>

            {/* Bottom: remaining label + edit button */}
            <View style={styles.bottomRow}>
              <View style={styles.remainingRow}>
                {!hasBudget ? <View style={[styles.dot, { backgroundColor: progressColor }]} /> : null}
                <View style={styles.remainingTextContainer}>
                  <AppText variant="bodySmall" weight="600" color="rgba(255,255,255,0.9)">
                    {remainingLabel}
                  </AppText>
                  {formattedEnd ? (
                    <AppText variant="caption" color="rgba(255,255,255,0.65)" style={styles.expiryText}>
                      Expires {formattedEnd}
                    </AppText>
                  ) : null}
                </View>
              </View>
              {onEditPress ? (
                <TouchableOpacity
                  style={[styles.editBtn, isPremium && styles.editBtnPremium]}
                  activeOpacity={0.85}
                  onPress={() => onEditPress(isExpired || isOver)}
                >
                  <Ionicons name="pencil" size={13} color={isPremium ? '#D4A017' : '#FFFFFF'} />
                  <AppText
                    variant="caption"
                    weight="700"
                    color={isPremium ? '#FFF176' : '#FFFFFF'}
                  >
                    {editButtonLabel}
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  bgRing1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -80,
    right: -60,
  },
  bgRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,160,23,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  premiumText: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200,230,201,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(200,230,201,0.25)',
  },
  statusOver: {
    backgroundColor: 'rgba(198,40,40,0.25)',
    borderColor: 'rgba(255,205,210,0.25)',
  },
  skeletonBody: {
    marginTop: Spacing.sm,
  },
  skeletonGap: {
    marginVertical: Spacing.md,
  },
  limitAmount: {
    fontSize: 38,
    lineHeight: 44,
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  remainingTextContainer: {
    flex: 1,
    gap: 1,
  },
  expiryText: {
    fontSize: 10,
    lineHeight: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  editBtnPremium: {
    backgroundColor: 'rgba(212,160,23,0.18)',
    borderColor: 'rgba(212,160,23,0.4)',
  },
});
