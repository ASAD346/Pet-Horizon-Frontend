export const EXPENSE_CATEGORIES = [
  'Food',
  'Vet',
  'Grooming',
  'Medicine',
  'Toys',
  'Supplies',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
