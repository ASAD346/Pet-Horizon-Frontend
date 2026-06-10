import { API_ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { log } from '@/lib/log';
import type {
  AdjustInventoryRequest,
  CreateInventoryItemRequest,
  InventoryItem,
  InventoryLowStockAlert,
  InventorySummary,
  InventoryTransaction,
  RestockInventoryRequest,
} from '@/types/inventory';

const SCOPE = 'InventoryAPI';

function petQuery(petId: string) {
  return `?petId=${encodeURIComponent(petId)}`;
}

export async function fetchInventorySummary(token: string, petId: string): Promise<InventorySummary> {
  log.info(SCOPE, 'GET /inventory', { petId });
  try {
    const data = await apiRequest<InventorySummary>(`${API_ENDPOINTS.inventory.summary}${petQuery(petId)}`, {
      token,
    });
    log.ok(SCOPE, 'Summary loaded', { petId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Summary load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function fetchInventoryItems(token: string, petId: string): Promise<InventoryItem[]> {
  log.info(SCOPE, 'GET /inventory/items', { petId });
  try {
    const data = await apiRequest<InventoryItem[]>(`${API_ENDPOINTS.inventory.items}${petQuery(petId)}`, {
      token,
    });
    log.ok(SCOPE, 'Items loaded', { petId, count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Items load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function createInventoryItem(
  token: string,
  payload: CreateInventoryItemRequest,
): Promise<InventoryItem> {
  log.info(SCOPE, 'POST /inventory/items', { petId: payload.petId });
  try {
    const data = await apiRequest<InventoryItem>(API_ENDPOINTS.inventory.createItem, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Item created', { id: data._id });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Create item failed', getErrorMessage(error));
    throw error;
  }
}

export async function restockInventory(
  token: string,
  payload: RestockInventoryRequest,
): Promise<InventoryItem> {
  log.info(SCOPE, 'POST /inventory/restock', { petId: payload.petId, amount: payload.amount });
  try {
    const data = await apiRequest<InventoryItem>(API_ENDPOINTS.inventory.restock, {
      method: 'POST',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Restocked', { petId: payload.petId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Restock failed', getErrorMessage(error));
    throw error;
  }
}

export async function adjustInventory(
  token: string,
  payload: AdjustInventoryRequest,
): Promise<InventoryItem> {
  log.info(SCOPE, 'PUT /inventory', { petId: payload.petId });
  try {
    const data = await apiRequest<InventoryItem>(API_ENDPOINTS.inventory.adjust, {
      method: 'PUT',
      token,
      body: payload,
    });
    log.ok(SCOPE, 'Inventory adjusted', { petId: payload.petId });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Adjust failed', getErrorMessage(error));
    throw error;
  }
}

export async function fetchLowStockAlert(
  token: string,
  petId: string,
): Promise<InventoryLowStockAlert> {
  log.info(SCOPE, 'GET /inventory/low-stock-alert', { petId });
  try {
    const data = await apiRequest<InventoryLowStockAlert>(
      `${API_ENDPOINTS.inventory.lowStock}${petQuery(petId)}`,
      { token },
    );
    log.ok(SCOPE, 'Low stock loaded', { petId, isLow: data.isLow });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Low stock load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}

export async function fetchInventoryTransactions(
  token: string,
  petId: string,
): Promise<InventoryTransaction[]> {
  log.info(SCOPE, 'GET /inventory/transactions', { petId });
  try {
    const data = await apiRequest<InventoryTransaction[]>(
      `${API_ENDPOINTS.inventory.transactions}${petQuery(petId)}`,
      { token },
    );
    log.ok(SCOPE, 'Transactions loaded', { petId, count: data.length });
    return data;
  } catch (error) {
    log.fail(SCOPE, 'Transactions load failed', { petId, error: getErrorMessage(error) });
    throw error;
  }
}
