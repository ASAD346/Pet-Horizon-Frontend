import { useCallback, useMemo, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { mapBudgetDisplay } from '@/lib/expense/expenseMappers';
import { log } from '@/lib/log';
import { fetchRemainingBudget } from '@/services/expense/expenseApi';
import type { BudgetRemainingItem } from '@/types/expense';
import { useStaleFocusLoader } from './useStaleFocusLoader';

export function useBudget(token: string | null, petId: string | null | undefined) {
  const [budgets, setBudgets] = useState<BudgetRemainingItem[]>([]);
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scopeKey = token && petId ? `${token}:${petId}` : null;

  const display = useMemo(() => {
    const active = budgets.find((item) => item.periodType === periodType) ?? null;
    return mapBudgetDisplay(active, periodType);
  }, [budgets, periodType]);

  const load = useCallback(async () => {
    if (!token || !petId) return [];
    const data = await fetchRemainingBudget(token, petId);
    return data.budgets ?? [];
  }, [token, petId]);

  const reload = useStaleFocusLoader({
    scopeKey,
    enabled: Boolean(token && petId),
    load,
    onSuccess: (rows) => {
      setBudgets(rows);
      setError(null);
    },
    onClear: () => {
      setBudgets([]);
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad) {
        setBudgets([]);
        setError(getErrorMessage(err));
        log.fail('Budget', 'Load failed', getErrorMessage(err));
      }
    },
    setLoading,
  });

  return { budget: display, budgets, periodType, setPeriodType, loading, error, reload };
}
