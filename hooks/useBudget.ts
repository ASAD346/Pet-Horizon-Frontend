import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import { mapWeeklyBudgetDisplay } from '@/lib/expense/expenseMappers';
import { log } from '@/lib/log';
import { fetchRemainingBudget } from '@/services/expense/expenseApi';

export function useBudget(token: string | null, petId: string | null | undefined) {
  const [display, setDisplay] = useState(() => mapWeeklyBudgetDisplay(null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setDisplay(mapWeeklyBudgetDisplay(null));
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRemainingBudget(token, petId);
      const weekly = data.budgets?.find((item) => item.periodType === 'weekly') ?? null;
      setDisplay(mapWeeklyBudgetDisplay(weekly));
    } catch (err) {
      setDisplay(mapWeeklyBudgetDisplay(null));
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

  return { budget: display, loading, error, reload };
}
