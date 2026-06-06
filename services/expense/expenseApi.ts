import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  ApiBudget,
  ApiExpense,
  BudgetRemainingResponse,
  CreateExpenseRequest,
  CreateExpenseResponse,
  ExpenseSummaryResponse,
  SetBudgetRequest,
  UpdateBudgetRequest,
  UpdateExpenseRequest,
} from '@/types/expense';

const SCOPE = 'ExpenseAPI';

export async function fetchExpenses(
  token: string,
  petId: string,
  month: string,
): Promise<ApiExpense[]> {
  log.info(SCOPE, 'GET /expenses', { petId, month });
  try {
    const query = `?petId=${encodeURIComponent(petId)}&month=${encodeURIComponent(month)}`;
    const data = await apiRequest<ApiExpense[]>(`${API_ENDPOINTS.expenses.list}${query}`, { token });
    log.ok(SCOPE, 'Expenses loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load expenses failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchExpenseSummary(
  token: string,
  petId: string,
  month: string,
): Promise<ExpenseSummaryResponse> {
  log.info(SCOPE, 'GET /expenses/summary', { petId, month });
  try {
    const query = `?petId=${encodeURIComponent(petId)}&month=${encodeURIComponent(month)}`;
    const data = await apiRequest<ExpenseSummaryResponse>(
      `${API_ENDPOINTS.expenses.summary}${query}`,
      { token },
    );
    log.ok(SCOPE, 'Expense summary loaded', { total: data.total });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Expense summary failed', getErrorMessage(error));
    throw error;
  }
}

export async function createExpense(
  token: string,
  payload: CreateExpenseRequest,
): Promise<CreateExpenseResponse> {
  log.info(SCOPE, 'POST /expenses', { petId: payload.petId, category: payload.category });
  try {
    const data = await apiRequest<CreateExpenseResponse>(API_ENDPOINTS.expenses.create, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Expense created', { id: data.expense?._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create expense failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateExpense(
  token: string,
  expenseId: string,
  payload: UpdateExpenseRequest,
): Promise<ApiExpense> {
  log.info(SCOPE, 'PUT /expenses/:id', { expenseId });
  try {
    const data = await apiRequest<ApiExpense>(API_ENDPOINTS.expenses.byId(expenseId), {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Expense updated', { expenseId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update expense failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteExpense(
  token: string,
  expenseId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /expenses/:id', { expenseId });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.expenses.byId(expenseId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Expense deleted', { expenseId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete expense failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchBudgets(token: string, petId: string): Promise<ApiBudget[]> {
  log.info(SCOPE, 'GET /budget', { petId });
  try {
    const query = `?petId=${encodeURIComponent(petId)}`;
    const data = await apiRequest<ApiBudget[]>(`${API_ENDPOINTS.budget.list}${query}`, { token });
    log.ok(SCOPE, 'Budgets loaded', { count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Load budgets failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchRemainingBudget(
  token: string,
  petId: string,
): Promise<BudgetRemainingResponse> {
  log.info(SCOPE, 'GET /budget/remaining', { petId });
  try {
    const query = `?petId=${encodeURIComponent(petId)}`;
    const data = await apiRequest<BudgetRemainingResponse>(
      `${API_ENDPOINTS.budget.remaining}${query}`,
      { token },
    );
    log.ok(SCOPE, 'Remaining budget loaded');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Remaining budget failed', getErrorMessage(error));
    throw error;
  }
}

export async function setBudget(token: string, payload: SetBudgetRequest): Promise<ApiBudget> {
  log.info(SCOPE, 'POST /budget', { petId: payload.petId, periodType: payload.periodType });
  try {
    const data = await apiRequest<ApiBudget>(API_ENDPOINTS.budget.create, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Budget set');
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Set budget failed', getErrorMessage(error));
    throw error;
  }
}

export async function updateBudget(
  token: string,
  budgetId: string,
  payload: UpdateBudgetRequest,
): Promise<ApiBudget> {
  log.info(SCOPE, 'PUT /budget/:id', { budgetId });
  try {
    const data = await apiRequest<ApiBudget>(API_ENDPOINTS.budget.byId(budgetId), {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Budget updated', { budgetId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Update budget failed', getErrorMessage(error));
    throw error;
  }
}

export async function deleteBudget(
  token: string,
  budgetId: string,
): Promise<{ message: string }> {
  log.info(SCOPE, 'DELETE /budget/:id', { budgetId });
  try {
    const data = await apiRequest<{ message: string }>(API_ENDPOINTS.budget.byId(budgetId), {
      method: 'DELETE',
      token,
    });
    log.ok(SCOPE, 'Budget deleted', { budgetId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Delete budget failed', getErrorMessage(error));
    throw error;
  }
}
