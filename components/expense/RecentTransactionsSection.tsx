import React, { useMemo } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from '../home/ColorIconBadge';
import { SectionHeader } from '../home/SectionHeader';
import { homePillCard } from '../home/homeStyles';
import { HomeTheme, Spacing } from '../../constants/theme';
import type { ExpenseTrackerCategory, ExpenseTransaction } from './expenseTrackerData';

interface RecentTransactionsSectionProps {
  categoryFilter: ExpenseTrackerCategory;
  transactions: ExpenseTransaction[];
  loading?: boolean;
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
}: RecentTransactionsSectionProps) {
  const filtered = useMemo(
    () => filterTransactions(transactions, categoryFilter),
    [transactions, categoryFilter],
  );

  return (
    <View style={styles.section}>
      <SectionHeader title="Recent Transactions" />
      {loading ? (
        <ActivityIndicator color={HomeTheme.cardGreen} style={styles.loader} />
      ) : filtered.length === 0 ? (
        <View style={[homePillCard.card, styles.emptyCard]}>
          <AppText variant="bodySmall" color={HomeTheme.textMuted}>
            No expenses yet. Tap + to add your first expense.
          </AppText>
        </View>
      ) : (
        filtered.map((item) => (
          <View key={item.id} style={homePillCard.card}>
            <ColorIconBadge
              color={item.color}
              backgroundColor={item.bg}
              materialIcon={item.materialIcon}
              size={46}
              iconSize={22}
              shape="circle"
            />
            <View style={styles.textBlock}>
              <AppText variant="bodySmall" weight="800" color={HomeTheme.text}>
                {item.title}
              </AppText>
              <AppText variant="caption" color={HomeTheme.textMuted}>
                {item.subtitle}
              </AppText>
            </View>
            <AppText variant="bodySmall" weight="800" color={HomeTheme.badgeRed}>
              {item.amount}
            </AppText>
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
  loader: {
    marginVertical: Spacing.md,
  },
  emptyCard: {
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
});
