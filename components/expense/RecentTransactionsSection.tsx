import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { ColorIconBadge } from '../home/ColorIconBadge';
import { SectionHeader } from '../home/SectionHeader';
import { homePillCard } from '../home/homeStyles';
import { HomeTheme, Spacing } from '../../constants/theme';
import {
  EXPENSE_TRACKER_TRANSACTIONS,
  type ExpenseTrackerCategory,
  type ExpenseTransaction,
} from './expenseTrackerData';

interface RecentTransactionsSectionProps {
  categoryFilter: ExpenseTrackerCategory;
}

function filterTransactions(
  items: ExpenseTransaction[],
  filter: ExpenseTrackerCategory
): ExpenseTransaction[] {
  if (filter === 'all') return items;
  return items.filter((item) => item.category === filter);
}

export function RecentTransactionsSection({ categoryFilter }: RecentTransactionsSectionProps) {
  const transactions = useMemo(
    () => filterTransactions(EXPENSE_TRACKER_TRANSACTIONS, categoryFilter),
    [categoryFilter]
  );

  return (
    <View style={styles.section}>
      <SectionHeader title="Recent Transactions" actionLabel="See All" onActionPress={() => {}} />
      {transactions.map((item) => (
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
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  textBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
});
