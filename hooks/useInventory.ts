import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import {
  adjustInventory,
  createInventoryItem,
  fetchInventoryItems,
  fetchInventorySummary,
  fetchInventoryTransactions,
  fetchLowStockAlert,
  restockInventory,
} from '@/services/inventory/inventoryApi';
import type {
  AdjustInventoryRequest,
  CreateInventoryItemRequest,
  InventoryItem,
  InventoryLowStockAlert,
  InventorySummary,
  InventoryTransaction,
  RestockInventoryRequest,
} from '@/types/inventory';

export function useInventory(token: string | null, petId: string | null, enabled = true) {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [lowStock, setLowStock] = useState<InventoryLowStockAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !petId || !enabled) {
      setSummary(null);
      setItems([]);
      setTransactions([]);
      setLowStock(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [summaryData, itemsData, txData, alertData] = await Promise.all([
        fetchInventorySummary(token, petId),
        fetchInventoryItems(token, petId),
        fetchInventoryTransactions(token, petId),
        fetchLowStockAlert(token, petId),
      ]);
      setSummary(summaryData);
      setItems(itemsData);
      setTransactions(txData);
      setLowStock(alertData);
    } catch (err) {
      setSummary(null);
      setItems([]);
      setTransactions([]);
      setLowStock(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, petId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createItem = useCallback(
    async (payload: CreateInventoryItemRequest) => {
      if (!token) return;
      setActionId('create');
      try {
        await createInventoryItem(token, payload);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const restock = useCallback(
    async (payload: RestockInventoryRequest) => {
      if (!token) return;
      setActionId('restock');
      try {
        await restockInventory(token, payload);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  const adjust = useCallback(
    async (payload: AdjustInventoryRequest) => {
      if (!token) return;
      setActionId('adjust');
      try {
        await adjustInventory(token, payload);
        await reload();
      } finally {
        setActionId(null);
      }
    },
    [token, reload],
  );

  return {
    summary,
    items,
    transactions,
    lowStock,
    loading,
    error,
    actionId,
    reload,
    createItem,
    restock,
    adjust,
  };
}
