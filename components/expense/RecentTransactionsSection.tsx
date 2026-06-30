import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from '../home/ColorIconBadge';
import { HomeTheme, Radius, Spacing } from '../../constants/theme';
import { SkeletonList } from '@/components/ui/skeletons';
import { homePillCard } from '../home/homeStyles';
import { useLocalization } from '@/hooks/useLocalization';
import { EmptyState } from '../ui/EmptyState';
import type { ExpenseTrackerCategory, ExpenseTransaction } from './expenseTrackerData';

const BRAND_GREEN = '#2E7D32';

interface RecentTransactionsSectionProps {
  categoryFilter: ExpenseTrackerCategory;
  transactions: ExpenseTransaction[];
  loading?: boolean;
  isPremium?: boolean;
  onAddExpensePress?: () => void;
}

function filterTransactions(
  items: ExpenseTransaction[],
  filter: ExpenseTrackerCategory,
): ExpenseTransaction[] {
  if (filter === 'all') return items;
  return items.filter((item) => item.category === filter);
}

export function RecentTransactionsSection({
  categoryFilter,
  transactions,
  loading,
  isPremium = false,
  onAddExpensePress,
}: RecentTransactionsSectionProps) {
  const router = useRouter();
  const { formatCurrency } = useLocalization();
  const filtered = useMemo(
    () => filterTransactions(transactions, categoryFilter),
    [transactions, categoryFilter],
  );

  const cardBorderColor = isPremium
    ? 'rgba(212, 160, 23, 0.35)'  // Gold trim for premium
    : 'rgba(46, 125, 50, 0.12)';  // Soft green border

  const iconColor = isPremium ? '#184F2E' : '#2E7D32';
  const iconBg = isPremium ? 'rgba(212, 160, 23, 0.08)' : 'rgba(46, 125, 50, 0.06)';

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.labelRow}>
          <AppText variant="body" weight="800" color={HomeTheme.text} style={styles.sectionTitle}>
            Recent Transactions
          </AppText>
        </View>
      </View>

      {loading ? (
        <SkeletonList count={3} cardStyle={homePillCard.card} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No expenses yet"
          description={categoryFilter === 'all'
            ? "Start tracking your pet's costs — vet visits, food, grooming, and more. Staying on budget has never been easier."
            : `No ${categoryFilter} expenses recorded this month. Add one to start tracking.`}
          buttonLabel="Log First Expense"
          onButtonPress={onAddExpensePress || (() => router.push('/expense/add' as Href))}
        />
      ) : (
        filtered.map((item) => (
          <View key={item.id} style={[styles.transactionRow, { borderWidth: 1, borderColor: cardBorderColor }]}>
            {/* Category Icon Badge */}
            <ColorIconBadge
              color={iconColor}
              backgroundColor={iconBg}
              materialIcon={item.materialIcon}
              size={46}
              iconSize={22}
              shape="circle"
            />

            {/* Info */}
            <View style={styles.textBlock}>
              <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                {item.title}
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted} style={styles.subtitle}>
                {item.subtitle}
              </AppText>
            </View>

            {/* Amount + badge */}
            <View style={styles.amountBlock}>
              <AppText variant="bodySmall" weight="800" color="#C62828" style={styles.amount}>
                -{formatCurrency(item.amountVal)}
              </AppText>
              <View style={styles.categoryPill}>
                <AppText variant="caption" weight="700" color={iconColor} style={styles.categoryText}>
                  {item.category}
                </AppText>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_GREEN,
  },
  sectionTitle: {
    fontSize: 16,
  },
  countBadge: {
    backgroundColor: 'rgba(46,125,50,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.15)',
  },
  countText: {
    fontSize: 11,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md + 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: 10,
    marginHorizontal: 2,
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  subtitle: {
    lineHeight: 16,
  },
  amountBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 15,
  },
  categoryPill: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md + 4,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#1A2B4E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
