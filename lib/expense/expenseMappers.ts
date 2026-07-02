import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ApiExpense, BudgetRemainingItem } from '@/types/expense';
import { formatInTimeZone } from '@/lib/timezone';

type MciIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type ExpenseTrackerCategory =
  | 'all'
  | 'food'
  | 'vet'
  | 'grooming'
  | 'medicine'
  | 'other';

export type ExpenseTransaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  amountVal: number;
  category: Exclude<ExpenseTrackerCategory, 'all'>;
  materialIcon: MciIcon;
  color: string;
  bg: string;
};
export const EXPENSE_TRACKER_CATEGORIES: {
  id: ExpenseTrackerCategory;
  label: string;
  materialIcon: MciIcon;
  color: string;
  bg: string;
}[] = [
  { id: 'all', label: 'All', materialIcon: 'view-grid', color: '#FFFFFF', bg: '#5CB35D' },
  { id: 'food', label: 'Food', materialIcon: 'silverware-fork-knife', color: '#5CB35D', bg: '#FFFFFF' },
  { id: 'vet', label: 'Vet', materialIcon: 'medical-bag', color: '#5B9BD5', bg: '#FFFFFF' },
  { id: 'grooming', label: 'Grooming', materialIcon: 'content-cut', color: '#9C27B0', bg: '#FFFFFF' },
  { id: 'medicine', label: 'Medicine', materialIcon: 'pill', color: '#FF9800', bg: '#FFFFFF' },
  { id: 'other', label: 'Other', materialIcon: 'dots-horizontal', color: '#607D8B', bg: '#FFFFFF' },
];

const CATEGORY_STYLE: Record<
  Exclude<ExpenseTrackerCategory, 'all'>,
  { color: string; bg: string; icon: MciIcon }
> = {
  food: { color: '#5CB35D', bg: '#E8F5E9', icon: 'silverware-fork-knife' },
  vet: { color: '#5B9BD5', bg: '#E3F2FD', icon: 'medical-bag' },
  grooming: { color: '#9C27B0', bg: '#F3E5F5', icon: 'content-cut' },
  medicine: { color: '#FF9800', bg: '#FFF3E0', icon: 'pill' },
  other: { color: '#607D8B', bg: '#ECEFF1', icon: 'dots-horizontal' },
};

export function normalizeExpenseCategory(category: string): Exclude<ExpenseTrackerCategory, 'all'> {
  const value = (category || '').toLowerCase();
  if (value === 'food') return 'food';
  if (value === 'vet') return 'vet';
  if (value === 'grooming') return 'grooming';
  if (value === 'medicine') return 'medicine';
  return 'other';
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(val);
}

export function formatExpenseDateLabel(iso: string, timezone: string): string {
  if (!iso) return 'Unknown Date';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const dayDate = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const dayNow = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const dayYesterday = formatInTimeZone(yesterday, timezone, 'yyyy-MM-dd');

  if (dayDate === dayNow) return 'Today';
  if (dayDate === dayYesterday) return 'Yesterday';
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

export function mapExpenseToTransaction(expense: ApiExpense, timezone = 'UTC'): ExpenseTransaction {
  const category = normalizeExpenseCategory(expense.category);
  const style = CATEGORY_STYLE[category];
  const note = expense.note?.trim();
  const title = note || category.charAt(0).toUpperCase() + category.slice(1);
  return {
    id: expense._id,
    title,
    subtitle: `${formatExpenseDateLabel(expense.expenseDate, timezone)} • ${category.charAt(0).toUpperCase() + category.slice(1)}`,
    amount: `-${formatCurrency(expense.amount)}`,
    amountVal: expense.amount,
    category,
    materialIcon: style.icon,
    color: style.color,
    bg: style.bg,
  };
}

export function currentMonthKey(date = new Date(), timezone = 'UTC'): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM');
}

export function mapBudgetDisplay(
  budget: BudgetRemainingItem | null | undefined,
  periodType: 'weekly' | 'monthly' = 'weekly',
) {
  const periodLabel =
    periodType === 'weekly' ? 'Weekly Spending Limit' : 'Monthly Spending Limit';

  if (!budget) {
    return {
      periodLabel,
      periodType,
      limitLabel: 'No budget set',
      spentPercent: 0,
      remainingLabel: 'Tap Edit Budget',
      status: 'Not set',
      hasBudget: false as const,
      budgetId: undefined as string | undefined,
      amountLimit: undefined as number | undefined,
      remaining: undefined as number | undefined,
      totalSpent: undefined as number | undefined,
      periodStart: undefined as string | undefined,
      periodEnd: undefined as string | undefined,
    };
  }

  const spentPercent =
    budget.amountLimit > 0
      ? Math.min(100, Math.round((budget.totalSpent / budget.amountLimit) * 100))
      : 0;

  return {
    periodLabel,
    periodType,
    limitLabel: formatCurrency(budget.amountLimit),
    spentPercent,
    remainingLabel: `${formatCurrency(budget.remaining)} left`,
    status: budget.isOverBudget ? 'Over budget' : 'On track',
    hasBudget: true as const,
    budgetId: budget.budgetId,
    amountLimit: budget.amountLimit,
    remaining: budget.remaining,
    totalSpent: budget.totalSpent,
    periodStart: budget.periodStart,
    periodEnd: budget.periodEnd,
  };
}

/** @deprecated Use mapBudgetDisplay */
export function mapWeeklyBudgetDisplay(budget?: BudgetRemainingItem | null) {
  return mapBudgetDisplay(budget, 'weekly');
}

export const API_EXPENSE_CATEGORIES = [
  { label: 'Food', value: 'food' },
  { label: 'Vet', value: 'vet' },
  { label: 'Grooming', value: 'grooming' },
  { label: 'Medicine', value: 'medicine' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Training', value: 'training' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'Other', value: 'other' },
] as const;
