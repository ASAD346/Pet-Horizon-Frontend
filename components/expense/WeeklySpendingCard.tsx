import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { Skeleton } from '@/components/ui/skeletons';
import { Radius, Spacing } from '../../constants/theme';
import { parseSafeDate } from '@/lib/timezone';

const FREE_GRAD: readonly [string, string] = ['#2E7D32', '#1B5E20']; // Rich emerald green gradient
const PREM_GRAD: readonly [string, string, string] = ['#0A2617', '#144026', '#1D5A37']; // Deep premium forest/emerald green gradient

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
  const accentColor = isPremium ? '#D4A017' : '#81C784';

  const isExpired = periodEnd ? parseSafeDate(periodEnd).getTime() < Date.now() : false;

  const formattedEnd = periodEnd
    ? parseSafeDate(periodEnd).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })
    : '00/00';

  const cleanPeriodLabel = React.useMemo(() => {
    const lower = (periodLabel || '').toLowerCase();
    if (lower.includes('week')) return 'Week';
    if (lower.includes('month')) return 'Month';
    return periodLabel;
  }, [periodLabel]);

  return (
    <View style={[
      styles.wrapper,
      {
        borderColor: isPremium ? '#D4A017' : 'rgba(255, 255, 255, 0.08)',
        borderWidth: isPremium ? 1.5 : 0.5,
        backgroundColor: isPremium ? '#0A2617' : '#1B5E20',
      }
    ]}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Soft, premium background radial ambient light */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.ambientGlow, { backgroundColor: isPremium ? 'rgba(212, 160, 23, 0.03)' : 'rgba(255, 255, 255, 0.03)' }]} />
        </View>

        {/* Card Header */}
        <View style={styles.topRow}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="paw" size={18} color={accentColor} />
            <AppText variant="caption" weight="800" color="#FFFFFF" style={styles.logoText}>
              PET HORIZON
            </AppText>
          </View>
          <View style={styles.topRight}>
            {hasBudget && (
              <View style={[styles.statusTag, isOver && styles.statusTagOver]}>
                <View style={[styles.statusDot, { backgroundColor: isOver ? '#F87171' : accentColor }]} />
                <AppText variant="caption" weight="800" color={isOver ? '#F87171' : '#FFFFFF'} style={styles.statusText}>
                  {isOver ? 'OVER BUDGET' : `${spentPercent}% SPENT`}
                </AppText>
              </View>
            )}
            {onEditPress && (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.8}
                onPress={() => onEditPress(isExpired || isOver)}
              >
                <Ionicons name="ellipsis-horizontal" size={14} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.skeletonBody}>
            <Skeleton width="50%" height={32} tone="dark" />
            <View style={styles.bottomRow}>
              <Skeleton width="30%" height={12} tone="dark" />
              <Skeleton width="20%" height={12} tone="dark" />
            </View>
          </View>
        ) : hasBudget ? (
          <>
            {/* Main Balance Display */}
            <View style={styles.balanceContainer}>
              <AppText variant="caption" weight="600" color="rgba(255,255,255,0.5)" style={styles.balanceLabel}>
                AVAILABLE BALANCE
              </AppText>
              <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.balanceText}>
                {remainingLabel}
              </AppText>
            </View>

            {/* Premium Sleek Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${clampedPercent}%`, backgroundColor: isOver ? '#F87171' : accentColor },
                  ]}
                />
              </View>
            </View>

            {/* Bottom Metadata Info */}
            <View style={styles.bottomRow}>
              <View style={styles.metaCol}>
                <AppText variant="caption" weight="600" color="rgba(255,255,255,0.4)" style={styles.metaHeader}>
                  LIMIT PERIOD
                </AppText>
                <AppText variant="bodySmall" weight="700" color="#FFFFFF" style={styles.metaVal}>
                  {cleanPeriodLabel}
                </AppText>
              </View>

              <View style={styles.metaCol}>
                <AppText variant="caption" weight="600" color="rgba(255,255,255,0.4)" style={styles.metaHeader}>
                  SPENDING LIMIT
                </AppText>
                <AppText variant="bodySmall" weight="700" color="#FFFFFF" style={styles.metaVal}>
                  {limitLabel}
                </AppText>
              </View>

              <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
                <AppText variant="caption" weight="600" color="rgba(255,255,255,0.4)" style={styles.metaHeader}>
                  EXPIRY
                </AppText>
                <AppText variant="bodySmall" weight="700" color="#FFFFFF" style={styles.metaVal}>
                  {formattedEnd}
                </AppText>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyHeader}>
              <MaterialCommunityIcons name="wallet-plus-outline" size={24} color={accentColor} />
              <AppText variant="body" weight="800" color="#FFFFFF" style={styles.emptyTitle}>
                No Budget Configured
              </AppText>
            </View>
            <AppText variant="caption" color="rgba(255,255,255,0.5)" style={styles.emptySubtitle}>
              Take control of your pet expenses. Configure a spending limit to start tracking.
            </AppText>
            <TouchableOpacity
              style={[styles.setupBtn, isPremium && styles.setupBtnPremium]}
              activeOpacity={0.8}
              onPress={() => onEditPress?.(true)}
            >
              <Ionicons name="add-circle" size={15} color={isPremium ? '#FFF176' : '#FFFFFF'} />
              <AppText variant="bodySmall" weight="800" color={isPremium ? '#FFF176' : '#FFFFFF'}>
                Configure Spending Budget
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    backgroundColor: '#1E1E21',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  ambientGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -110,
    right: -50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    letterSpacing: 1.5,
    fontSize: 9,
    opacity: 0.9,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm || 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusTagOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  balanceContainer: {
    marginBottom: 10,
  },
  balanceLabel: {
    letterSpacing: 0.5,
    fontSize: 8,
    marginBottom: 2,
  },
  balanceText: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaHeader: {
    fontSize: 8,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 11,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  setupBtnPremium: {
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    borderColor: 'rgba(212, 160, 23, 0.15)',
  },
  skeletonBody: {
    marginVertical: 4,
  },
  emptyContainer: {
    paddingVertical: 4,
    alignItems: 'flex-start',
    width: '100%',
  },
  emptyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  emptyTitle: {
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    lineHeight: 16,
    marginBottom: 8,
  },
});
