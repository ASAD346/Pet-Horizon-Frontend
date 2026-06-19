import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePet } from '@/hooks/useActivePet';
import { useBudget } from '@/hooks/useBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useNotifications } from '@/hooks/useNotifications';
import { ExpenseCategoryTiles } from './ExpenseCategoryTiles';
import { ExpenseTrackerHeader } from './ExpenseTrackerHeader';
import { EditBudgetSheet } from './EditBudgetSheet';
import type { ExpenseTrackerCategory } from './expenseTrackerData';
import { RecentTransactionsSection } from './RecentTransactionsSection';
import { WeeklySpendingCard } from './WeeklySpendingCard';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { HomeTheme, Spacing } from '../../constants/theme';

interface ExpenseTrackerViewProps {
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
}

export function ExpenseTrackerView({
  onJournalPress,
  onNotificationsPress,
}: ExpenseTrackerViewProps) {
  const router = useRouter();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token } = useAuth();
  const { pet, loading: petLoading } = useActivePet(token);
  const { expenses, loading: expensesLoading, error, reload: reloadExpenses } = useExpenses(
    token,
    pet?._id,
  );
  const { budget, loading: budgetLoading, periodType, setPeriodType, reload: reloadBudget } = useBudget(
    token,
    pet?._id,
  );
  const { unreadCount } = useNotifications(token);

  const [category, setCategory] = useState<ExpenseTrackerCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [budgetSheetVisible, setBudgetSheetVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reloadExpenses(), reloadBudget()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={HomeTheme.cardGreen} />
        }
      >
        <ExpenseTrackerHeader
          notificationCount={unreadCount}
          onJournalPress={onJournalPress}
          onNotificationsPress={onNotificationsPress}
        />

        {!petLoading && !pet ? (
          <AuthInfoBanner message="Add a pet from Home to track expenses." />
        ) : null}

        {error ? <AuthErrorBanner message={error} /> : null}

        <WeeklySpendingCard
          periodLabel={budget.periodLabel}
          periodType={budget.periodType}
          limitLabel={budget.limitLabel}
          spentPercent={budget.spentPercent}
          remainingLabel={budget.remainingLabel}
          status={budget.status}
          hasBudget={budget.hasBudget}
          loading={budgetLoading || petLoading}
          onPeriodChange={setPeriodType}
          onEditPress={() => setBudgetSheetVisible(true)}
        />

        <ExpenseCategoryTiles selected={category} onSelect={setCategory} />
        <RecentTransactionsSection
          categoryFilter={category}
          transactions={expenses}
          loading={expensesLoading || petLoading}
        />

      </ScrollView>

      {pet ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: tabBarClearance + Spacing.sm }]}
          activeOpacity={0.9}
          onPress={() => router.push('/expense/add' as Href)}
        >
          <Ionicons name="add" size={28} color={HomeTheme.white} />
        </TouchableOpacity>
      ) : null}

      <EditBudgetSheet
        visible={budgetSheetVisible}
        petId={pet?._id ?? null}
        token={token}
        budgetId={budget.budgetId}
        currentLimit={budget.amountLimit}
        periodType={periodType}
        onClose={() => setBudgetSheetVisible(false)}
        onSaved={() => {
          reloadBudget();
          reloadExpenses();
        }}
      />
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
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: HomeTheme.cardGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
