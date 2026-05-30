export type ExpenseTrackerCategory = 'all' | 'food' | 'medical' | 'transport';

export type ExpenseTransaction = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  category: Exclude<ExpenseTrackerCategory, 'all'>;
  materialIcon: 'silverware-fork-knife' | 'medical-bag' | 'car-side';
  color: string;
  bg: string;
};

export const EXPENSE_TRACKER_CATEGORIES: {
  id: ExpenseTrackerCategory;
  label: string;
  materialIcon: 'view-grid' | 'silverware-fork-knife' | 'medical-bag' | 'car-side';
  color: string;
  bg: string;
}[] = [
  { id: 'all', label: 'All', materialIcon: 'view-grid', color: '#FFFFFF', bg: '#5CB35D' },
  { id: 'food', label: 'Food', materialIcon: 'silverware-fork-knife', color: '#5CB35D', bg: '#FFFFFF' },
  { id: 'medical', label: 'Medical', materialIcon: 'medical-bag', color: '#5B9BD5', bg: '#FFFFFF' },
  { id: 'transport', label: 'Transport', materialIcon: 'car-side', color: '#9C27B0', bg: '#FFFFFF' },
];

export const EXPENSE_TRACKER_TRANSACTIONS: ExpenseTransaction[] = [
  {
    id: '1',
    title: 'Premium Kibble',
    subtitle: 'Today • Food',
    amount: '-$45.00',
    category: 'food',
    materialIcon: 'silverware-fork-knife',
    color: '#5CB35D',
    bg: '#E8F5E9',
  },
  {
    id: '2',
    title: 'Rabies Vaccination',
    subtitle: 'Yesterday • Medical',
    amount: '-$120.00',
    category: 'medical',
    materialIcon: 'medical-bag',
    color: '#5B9BD5',
    bg: '#E3F2FD',
  },
];

export const WEEKLY_BUDGET = {
  limitLabel: '$500 /wk',
  spentPercent: 69,
  remainingLabel: '$157.50 Left',
  status: 'On Track',
};
