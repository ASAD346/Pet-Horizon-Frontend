import { useCallback, useMemo, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import {
  currentMonthKey,
  mapExpenseToTransaction,
  type ExpenseTransaction,
} from '@/lib/expense/expenseMappers';
import { log } from '@/lib/log';
import { fetchExpenses } from '@/services/expense/expenseApi';
import { useStaleFocusLoader } from './useStaleFocusLoader';

export function useExpenses(token: string | null, petId: string | null | undefined) {
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const month = useMemo(() => currentMonthKey(), []);
  const scopeKey = token && petId ? `${token}:${petId}:${month}` : null;

  const load = useCallback(async () => {
    if (!token || !petId) return [];
    const rows = await fetchExpenses(token, petId, month);
    return rows.map(mapExpenseToTransaction);
  }, [token, petId, month]);

  const reload = useStaleFocusLoader({
    scopeKey,
    enabled: Boolean(token && petId),
    load,
    onSuccess: (rows) => {
      setExpenses(rows);
      setError(null);
    },
    onClear: () => {
      setExpenses([]);
      setError(null);
    },
    onError: (err, isFirstLoad) => {
      if (isFirstLoad) {
        setError(getErrorMessage(err));
        log.fail('Expenses', 'Load failed', getErrorMessage(err));
      }
    },
    setLoading,
  });

  return { expenses, loading, error, reload, month };
}
