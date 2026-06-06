import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
});

interface WeeklySpendingCardProps {
  limitLabel: string;
  spentPercent: number;
  remainingLabel: string;
  status: string;
  loading?: boolean;
  onEditPress?: () => void;
}

export function WeeklySpendingCard({
  limitLabel,
  spentPercent,
  remainingLabel,
  status,
  loading,
  onEditPress,
}: WeeklySpendingCardProps) {
  const isOver = status === 'Over Budget';

  return (
    <View style={[styles.card, cardShadow]}>
      <View style={styles.topRow}>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.75)">
          Weekly Spending Limit
        </AppText>
        <View style={[styles.statusBadge, isOver && styles.statusOver]}>
          <Ionicons
            name={isOver ? 'alert-circle' : 'checkmark-circle'}
            size={14}
            color={isOver ? '#FFCDD2' : HomeTheme.green}
          />
          <AppText variant="caption" weight="700" color={isOver ? '#FFCDD2' : HomeTheme.green}>
            {status}
          </AppText>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={HomeTheme.white} style={styles.loader} />
      ) : (
        <>
          <AppText variant="h1" weight="800" color={HomeTheme.white} style={styles.limitAmount}>
            {limitLabel}
          </AppText>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${spentPercent}%` }]} />
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.remainingRow}>
              <View style={styles.dot} />
              <AppText variant="bodySmall" weight="600" color={HomeTheme.white}>
                {remainingLabel}
              </AppText>
            </View>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.85} onPress={onEditPress}>
              <AppText variant="caption" weight="700" color={HomeTheme.white}>
                Edit Budget
              </AppText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A2B4E',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(92,179,93,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusOver: {
    backgroundColor: 'rgba(198,40,40,0.25)',
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  limitAmount: {
    fontSize: 36,
    lineHeight: 42,
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: HomeTheme.green,
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
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HomeTheme.green,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
});
