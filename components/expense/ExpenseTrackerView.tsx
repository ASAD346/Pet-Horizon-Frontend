import { AuthInfoBanner } from '@/components/auth/AuthInfoBanner';
import { useToast } from '@/hooks/useToast';
import { SheetOptionPicker } from '@/components/sheets';
import { useActivePet } from '@/hooks/useActivePet';
import { useAuth } from '@/hooks/useAuth';
import { useBudget } from '@/hooks/useBudget';
import { useExpenses } from '@/hooks/useExpenses';
import { useLocalization } from '@/hooks/useLocalization';
import { useNotifications } from '@/hooks/useNotifications';
import { usePetPermissions } from '@/hooks/usePetPermissions';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeTheme, Radius, Spacing, Palette } from '../../constants/theme';
import { AddExpenseView } from './AddExpenseView';
import { EditBudgetSheet } from './EditBudgetSheet';
import { ExpenseCategoryTiles } from './ExpenseCategoryTiles';
import type { ExpenseTrackerCategory } from './expenseTrackerData';
import { ExpenseTrackerHeader } from './ExpenseTrackerHeader';
import { RecentTransactionsSection } from './RecentTransactionsSection';
import { WeeklySpendingCard } from './WeeklySpendingCard';
import { SkeletonExpenseTracker } from '@/components/ui/skeletons';

interface ExpenseTrackerViewProps {
  onJournalPress?: () => void;
  onNotificationsPress?: () => void;
}

export function ExpenseTrackerView({
  onJournalPress,
  onNotificationsPress,
}: ExpenseTrackerViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearance: tabBarClearance } = useTabBarLayout();
  const { token, user } = useAuth();
  const { pet, loading: petLoading } = useActivePet(token);
  const {
    canViewExpenses,
    canEditExpenses,
    canViewJournal,
    accessBannerMessage,
  } = usePetPermissions(token, pet, user?._id);
  const { formatCurrency } = useLocalization();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  const monthOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push({ label, value });
    }
    return list;
  }, []);

  const selectedMonthLabel = useMemo(() => {
    const match = monthOptions.find((o) => o.value === selectedMonth);
    return match ? match.label : '';
  }, [selectedMonth, monthOptions]);

  const { expenses, loading: expensesLoading, error, reload: reloadExpenses, addLocalExpense } = useExpenses(
    token,
    pet?._id,
    selectedMonth,
  );
  const { budget, loading: budgetLoading, periodType, setPeriodType, reload: reloadBudget } = useBudget(
    token,
    pet?._id,
  );
  const { showErrorToast } = useToast();

  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error, showErrorToast]);

  const { unreadCount } = useNotifications(token);
  const isPremium = user?.premiumStatus === 'premium';
  const brandColor = isPremium ? Palette.premium.emerald : Palette.success;

  const [category, setCategory] = useState<ExpenseTrackerCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [budgetSheetVisible, setBudgetSheetVisible] = useState(false);
  const [isNewBudget, setIsNewBudget] = useState(false);
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reloadExpenses(true), reloadBudget(true)]);
    setRefreshing(false);
  };

  return (
    <View style={styles.safeArea}>
      <ExpenseTrackerHeader
        notificationCount={unreadCount}
        onJournalPress={canViewJournal ? onJournalPress : undefined}
        onNotificationsPress={onNotificationsPress}
        showJournal={canViewJournal}
        isPremium={isPremium}
        topInset={insets.top}
        selectedMonthLabel={selectedMonthLabel}
        onDatePress={() => setMonthPickerVisible(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={HomeTheme.cardGreen} />
        }
      >

        {petLoading && !pet ? (
          <SkeletonExpenseTracker />
        ) : null}

        {!petLoading && !pet ? (
          <AuthInfoBanner message="Add a pet from the Home tab to start tracking their expenses and budget." />
        ) : null}

        {pet && !canViewExpenses ? (
          <AuthInfoBanner message="You don't have access to this pet's expenses. Ask the owner to update your permissions." />
        ) : null}

        {accessBannerMessage && canViewExpenses ? (
          <AuthInfoBanner message={accessBannerMessage} />
        ) : null}

        {canViewExpenses ? (
          <>
            <WeeklySpendingCard
              periodLabel={budget.periodLabel}
              limitLabel={budget.hasBudget && budget.amountLimit !== undefined ? formatCurrency(budget.amountLimit) : 'No budget set'}
              spentPercent={budget.spentPercent}
              remainingLabel={budget.hasBudget && budget.remaining !== undefined ? `${formatCurrency(budget.remaining)} left` : 'Tap Edit Budget'}
              status={budget.status}
              hasBudget={budget.hasBudget}
              loading={budgetLoading || petLoading}
              isPremium={isPremium}
              onEditPress={canEditExpenses ? (isNew) => {
                setIsNewBudget(!!isNew);
                setBudgetSheetVisible(true);
              } : undefined}
              periodStart={budget.periodStart}
              periodEnd={budget.periodEnd}
            />

            <ExpenseCategoryTiles selected={category} onSelect={setCategory} />
            <RecentTransactionsSection
              categoryFilter={category}
              transactions={expenses}
              loading={expensesLoading || petLoading}
              isPremium={isPremium}
              onAddExpensePress={() => setAddExpenseVisible(true)}
            />
          </>
        ) : null}

      </ScrollView>

      {pet && canEditExpenses ? (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: brandColor, bottom: tabBarClearance + 20 }]}
          activeOpacity={0.95}
          onPress={() => setAddExpenseVisible(true)}
        >
          <Ionicons name="add" size={28} color={HomeTheme.white} />
        </TouchableOpacity>
      ) : null}

      {pet && canEditExpenses ? (
        <EditBudgetSheet
          visible={budgetSheetVisible}
          petId={pet?._id ?? null}
          token={token}
          budgetId={isNewBudget ? undefined : budget.budgetId}
          currentLimit={isNewBudget ? undefined : budget.amountLimit}
          periodType={periodType}
          isPremium={isPremium}
          periodStart={isNewBudget ? undefined : budget.periodStart}
          periodEnd={isNewBudget ? undefined : budget.periodEnd}
          onClose={() => setBudgetSheetVisible(false)}
          onSaved={(savedPeriod) => {
            if (savedPeriod) {
              setPeriodType(savedPeriod);
            }
            reloadBudget(true, true);
            reloadExpenses(true, true);
          }}
        />
      ) : null}

      {pet && canEditExpenses ? (
        <AddExpenseView
          visible={addExpenseVisible}
          petId={pet?._id ?? null}
          token={token}
          isPremium={isPremium}
          onClose={() => setAddExpenseVisible(false)}
          onSaved={(newExpense) => {
            setAddExpenseVisible(false);
            if (newExpense) {
              addLocalExpense(newExpense);
            }
            reloadBudget(true, true);
          }}
        />
      ) : null}

      <SheetOptionPicker
        visible={monthPickerVisible}
        title="Select Month"
        options={monthOptions}
        selectedValue={selectedMonth}
        onClose={() => setMonthPickerVisible(false)}
        onSelect={(value) => {
          setSelectedMonth(value);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F7F1', // Matches ProfileTheme.background
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 5.5,
      },
      android: { elevation: 8 },
    }),
  },
});
