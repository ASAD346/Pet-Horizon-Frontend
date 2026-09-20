import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import type { ApiExpense } from '@/types/expense';
import {
  mapExpenseToTransaction,
  type ExpenseTransaction,
} from '@/lib/expense/expenseMappers';
import { fetchExpenses } from '@/services/expense/expenseApi';
import { useTimezone } from '@/hooks/useTimezone';
import { useLocalization } from '@/hooks/useLocalization';
import { parseSafeDate } from '@/lib/timezone';

export function useExpenses(
  token: string | null,
  petId: string | null | undefined,
  month: string,
) {
  const { timezone } = useTimezone();
  const { currency } = useLocalization();
  const queryKey = ['expenses', petId, month, currency];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!token || !petId) return [];
      const rows = await fetchExpenses(token, petId, month);
      return rows
        .map((row) => mapExpenseToTransaction(row, timezone, currency))
        .sort((a, b) => {
          const timeA = a.expenseDate ? parseSafeDate(a.expenseDate).getTime() : 0;
          const timeB = b.expenseDate ? parseSafeDate(b.expenseDate).getTime() : 0;
          return timeB - timeA;
        });
    },
    enabled: Boolean(token && petId),
    staleTime: 1000 * 60 * 2, // 2 min stale time for instant load
  });

  return {
    expenses: data ?? [],
    loading: isLoading && !data,
    isFetching,
    error: error ? getErrorMessage(error) : null,
    reload: () => refetch(),
    month,
  };
}
