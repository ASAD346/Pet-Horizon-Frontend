import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { mapBudgetDisplay } from '@/lib/expense/expenseMappers';
import { log } from '@/lib/log';
import { fetchRemainingBudget } from '@/services/expense/expenseApi';
import type { BudgetRemainingItem } from '@/types/expense';

export function useBudget(token: string | null, petId: string | null | undefined) {
  const [budgets, setBudgets] = useState<BudgetRemainingItem[]>([]);
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(() => {
    const active = budgets.find((item) => item.periodType === periodType) ?? null;
    return mapBudgetDisplay(active, periodType);
  }, [budgets, periodType]);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setBudgets([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRemainingBudget(token, petId);
      setBudgets(data.budgets ?? []);
    } catch (err) {
      setBudgets([]);
      setError(getErrorMessage(err));
      log.fail('Budget', 'Load failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { budget: display, budgets, periodType, setPeriodType, loading, error, reload };
}
