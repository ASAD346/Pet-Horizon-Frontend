import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { mapBudgetDisplay } from '@/lib/expense/expenseMappers';
import { fetchRemainingBudget } from '@/services/expense/expenseApi';
import type { BudgetRemainingItem } from '@/types/expense';

export function useBudget(token: string | null, petId: string | null | undefined) {
  const queryKey = ['budget', petId];

  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');

  const { data: budgets = [], isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!token || !petId) return [];
      
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const clientDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const data = await fetchRemainingBudget(token, petId, clientDate);
      const rows = data.budgets ?? [];
      
      // Auto-select period type if the current one isn't active but the other is
      if (rows && rows.length > 0) {
        const currentActive = rows.find((b) => b.periodType === periodType && b.amountLimit > 0);
        if (!currentActive) {
          const hasWeekly = rows.some((b) => b.periodType === 'weekly' && b.amountLimit > 0);
          const hasMonthly = rows.some((b) => b.periodType === 'monthly' && b.amountLimit > 0);
          if (!hasWeekly && hasMonthly) {
            setPeriodType('monthly');
          } else if (hasWeekly && !hasMonthly) {
            setPeriodType('weekly');
          }
        }
      }
      return rows;
    },
    enabled: Boolean(token && petId),
    staleTime: 0,
  });

  const display = useMemo(() => {
    const active = budgets.find((item) => item.periodType === periodType) ?? null;
    return mapBudgetDisplay(active, periodType);
  }, [budgets, periodType]);

  return {
    budget: display,
    periodType,
    setPeriodType,
    loading: isFetching,
    error: error ? getErrorMessage(error) : null,
    reload: () => refetch(),
  };
}
