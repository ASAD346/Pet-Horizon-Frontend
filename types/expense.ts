export type ExpenseCategory =
  | 'food'
  | 'vet'
  | 'grooming'
  | 'medicine'
  | 'accessories'
  | 'training'
  | 'boarding'
  | 'other';

export interface ApiExpense {
  _id: string;
  petId: string;
  userId: string;
  category: ExpenseCategory | string;
  amount: number;
  note?: string;
  expenseDate: string;
  receiptImage?: string | null;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseRequest {
  petId: string;
  category: ExpenseCategory | string;
  amount: number;
  note?: string;
  date?: string;
  receiptImage?: string | null;
}

export interface UpdateExpenseRequest {
  amount?: number;
  note?: string;
  date?: string;
  receiptImage?: string | null;
}

export interface ExpenseSummaryResponse {
  total: number;
  categories: Record<string, number>;
}

export interface ApiBudget {
  _id: string;
  petId: string;
  amountLimit: number;
  periodType: 'weekly' | 'monthly';
  startDate?: string;
  createdByUserId?: string;
}

export interface BudgetRemainingItem {
  budgetId: string;
  periodType: 'weekly' | 'monthly';
  amountLimit: number;
  totalSpent: number;
  remaining: number;
  isOverBudget: boolean;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface BudgetRemainingResponse {
  message?: string;
  currency: string;
  budgets: BudgetRemainingItem[];
}

export interface SetBudgetRequest {
  petId: string;
  amountLimit: number;
  periodType: 'weekly' | 'monthly';
  startDate?: string;
}

export interface UpdateBudgetRequest {
  amountLimit?: number;
  periodType?: 'weekly' | 'monthly';
  startDate?: string;
}

export interface CreateExpenseResponse {
  expense: ApiExpense;
  budgetStatus?: BudgetRemainingResponse;
}
