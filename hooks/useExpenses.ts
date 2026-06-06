import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/lib/api/errors';
import {
  currentMonthKey,
  mapExpenseToTransaction,
  type ExpenseTransaction,
} from '@/lib/expense/expenseMappers';
import { log } from '@/lib/log';
import { fetchExpenses } from '@/services/expense/expenseApi';

export function useExpenses(token: string | null, petId: string | null | undefined) {
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const month = useMemo(() => currentMonthKey(), []);

  const reload = useCallback(async () => {
    if (!token || !petId) {
      setExpenses([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchExpenses(token, petId, month);
      setExpenses(rows.map(mapExpenseToTransaction));
    } catch (err) {
      setExpenses([]);
      setError(getErrorMessage(err));
      log.fail('Expenses', 'Load failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, month]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { expenses, loading, error, reload, month };
}
