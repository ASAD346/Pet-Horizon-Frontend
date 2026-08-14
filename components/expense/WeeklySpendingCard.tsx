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
        ) : (
          <>
            {/* Main Balance Display */}
            <View style={styles.balanceContainer}>
              <AppText variant="caption" weight="600" color="rgba(255,255,255,0.5)" style={styles.balanceLabel}>
                AVAILABLE BALANCE
              </AppText>
              <AppText variant="h1" weight="800" color="#FFFFFF" style={styles.balanceText}>
                {hasBudget ? remainingLabel : '$0.00'}
              </AppText>
            </View>

            {/* Premium Sleek Progress Bar */}
            {hasBudget && (
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
            )}

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
                  {hasBudget ? limitLabel : 'NOT SET'}
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

            {!hasBudget && (
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
            )}
          </>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    marginBottom: Spacing.md + 2,
    overflow: 'hidden',
    backgroundColor: '#1E1E21',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  card: {
    padding: 20,
    borderRadius: 20,
  },
  ambientGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -120,
    right: -60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    letterSpacing: 1.5,
    fontSize: 10,
    opacity: 0.9,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm || 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusTagOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  balanceContainer: {
    marginBottom: 14,
  },
  balanceLabel: {
    letterSpacing: 0.5,
    fontSize: 9,
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  progressContainer: {
    marginBottom: 16,
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
    marginBottom: 3,
  },
  metaVal: {
    fontSize: 12,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
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
});
