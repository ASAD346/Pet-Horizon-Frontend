import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseCategoryTiles } from './ExpenseCategoryTiles';
import { ExpenseTrackerHeader } from './ExpenseTrackerHeader';
import type { ExpenseTrackerCategory } from './expenseTrackerData';
import { RecentTransactionsSection } from './RecentTransactionsSection';
import { WeeklySpendingCard } from './WeeklySpendingCard';
import { HomeTheme, Spacing } from '../../constants/theme';

interface ExpenseTrackerViewProps {
  onJournalPress?: () => void;
}

export function ExpenseTrackerView({ onJournalPress }: ExpenseTrackerViewProps) {
  const [category, setCategory] = useState<ExpenseTrackerCategory>('all');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ExpenseTrackerHeader onJournalPress={onJournalPress} />
        <WeeklySpendingCard />
        <ExpenseCategoryTiles selected={category} onSelect={setCategory} />
        <RecentTransactionsSection categoryFilter={category} />
        <View style={styles.tabSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HomeTheme.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  tabSpacer: {
    height: 88,
  },
});
