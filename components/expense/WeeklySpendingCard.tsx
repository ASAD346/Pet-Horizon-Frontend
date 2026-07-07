import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Skeleton } from '@/components/ui/skeletons';
import { Radius, Spacing } from '../../constants/theme';
import { parseSafeDate } from '@/lib/timezone';

// Professional gradient styling
const FREE_GRAD: readonly [string, string] = ['#2E7D32', '#4CAF50'];
const FREE_SHADOW = 'rgba(46, 125, 50, 0.2)';

const PREM_GRAD: readonly [string, string, string] = ['#0A2518', '#123C27', '#1B5436'];
const PREM_SHADOW = 'rgba(10, 37, 24, 0.25)';

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

  // Premium gets gold progress fills, Free gets soft green
  const progressColor = isOver ? '#F87171' : (isPremium ? '#D4A017' : '#A5D6A7');

  const isExpired = periodEnd ? parseSafeDate(periodEnd).getTime() < Date.now() : false;

  const formattedEnd = periodEnd
    ? parseSafeDate(periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={[
      styles.wrapper, 
      { shadowColor }, 
      isPremium && { borderWidth: 1.5, borderColor: '#D4A017', borderRadius: 20 }
    ]}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative glassmorphic background highlights */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.bgGlow} />
        </View>

        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <AppText variant="caption" weight="800" color="rgba(255,255,255,0.75)" style={styles.metaTitle}>
              {periodLabel.toUpperCase()}
            </AppText>
            {formattedEnd ? (
              <AppText variant="caption" color="rgba(255,255,255,0.45)" style={styles.expiryLabel}>
                • Ends {formattedEnd}
              </AppText>
            ) : null}
          </View>
          {onEditPress ? (
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => onEditPress(isExpired || isOver)}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.skeletonBody}>
            <Skeleton width="45%" height={32} tone="dark" />
            <Skeleton width="100%" height={6} borderRadius={3} tone="dark" style={styles.skeletonGap} />
            <View style={styles.bottomRow}>
              <Skeleton width="30%" height={12} tone="dark" />
              <Skeleton width="20%" height={12} tone="dark" />
            </View>
          </View>
        ) : (
          <>
            {/* Center Area: Actionable remaining balance focus */}
            <View style={styles.balanceContainer}>
              <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.balanceText} ellipsizeMode="tail" numberOfLines={1}>
                {hasBudget ? remainingLabel : 'No Budget Set'}
              </AppText>
              {hasBudget && (
                <AppText variant="caption" color="rgba(255,255,255,0.55)" style={styles.subtext}>
                  Available remaining balance
                </AppText>
              )}
            </View>

            {/* Premium, sleek indicator bar */}
            {hasBudget && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${clampedPercent}%`, backgroundColor: progressColor },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Bottom Info Row */}
            <View style={styles.bottomRow}>
              {hasBudget ? (
                <>
                  <AppText variant="caption" weight="700" color="rgba(255,255,255,0.8)" style={{ flexShrink: 1, marginRight: 8 }} ellipsizeMode="tail" numberOfLines={1}>
                    Limit: {limitLabel}
                  </AppText>
                  <View style={[
                    styles.statusTag, 
                    isOver && styles.statusTagOver,
                    isPremium && !isOver && { borderColor: 'rgba(212, 160, 23, 0.3)' }
                  ]}>
                    <View style={[styles.statusDot, { backgroundColor: progressColor }]} />
                    <AppText variant="caption" weight="800" color={isOver ? '#F87171' : (isPremium ? '#FFF176' : '#A7F3D0')} style={styles.statusText} ellipsizeMode="tail" numberOfLines={1}>
                      {isOver ? 'Over Limit' : `${spentPercent}% Spent`}
                    </AppText>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.setupBtn, isPremium && styles.setupBtnPremium]}
                  activeOpacity={0.8}
                  onPress={() => onEditPress?.(true)}
                >
                  <Ionicons name="add-circle" size={16} color={isPremium ? '#FFF176' : '#FFFFFF'} />
                  <AppText variant="bodySmall" weight="800" color={isPremium ? '#FFF176' : '#FFFFFF'}>
                    Set a Spending Limit
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </LinearGradient>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    marginBottom: Spacing.md + 4,
    ...cardShadow,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.lg - 2,
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: -100,
    right: -50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTitle: {
    letterSpacing: 1.2,
  },
  expiryLabel: {
    fontSize: 11,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonBody: {
    marginVertical: Spacing.sm,
  },
  skeletonGap: {
    marginVertical: Spacing.md,
  },
  balanceContainer: {
    marginVertical: Spacing.xs,
  },
  balanceText: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtext: {
    marginTop: 2,
    letterSpacing: 0.2,
  },
  progressContainer: {
    marginVertical: Spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statusTagOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  setupBtnPremium: {
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    borderColor: 'rgba(212, 160, 23, 0.25)',
  },
});
