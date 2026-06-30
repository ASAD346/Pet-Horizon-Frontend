import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import type { ApiExpense } from '@/types/expense';
import {
  mapExpenseToTransaction,
  type ExpenseTransaction,
} from '@/lib/expense/expenseMappers';
import { fetchExpenses } from '@/services/expense/expenseApi';

export function useExpenses(
  token: string | null,
  petId: string | null | undefined,
  month: string,
) {
  const queryClient = useQueryClient();
  const queryKey = ['expenses', petId, month];

  const { data, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!token || !petId) return [];
      const rows = await fetchExpenses(token, petId, month);
      return rows.map(mapExpenseToTransaction);
    },
    enabled: Boolean(token && petId),
    staleTime: 0,
  });

  const addLocalExpense = useCallback((newApiExpense: ApiExpense) => {
    const newTx = mapExpenseToTransaction(newApiExpense);
    // Optimistically update the cache so it appears immediately
    queryClient.setQueryData(queryKey, (old: ExpenseTransaction[] = []) => [newTx, ...old]);
  }, [queryClient, queryKey]);

  return {
    expenses: data ?? [],
    loading: isFetching,
    error: error ? getErrorMessage(error) : null,
    reload: () => refetch(),
    month,
    addLocalExpense,
  };
}
