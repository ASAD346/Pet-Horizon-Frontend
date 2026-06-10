export interface InventoryItem {
  _id: string;
  petId: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit?: string;
  lowThreshold?: number;
  expiryDate?: string | null;
  lastRestocked?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventorySummary {
  itemId: string;
  currentStock: number;
  unit: string;
  lowThreshold: number;
  itemName: string;
}

export interface InventoryLowStockAlert {
  isLow: boolean;
  currentStock: number;
  lowThreshold: number;
}

export interface InventoryTransaction {
  _id: string;
  petId: string;
  inventoryItemId?: string;
  delta: number;
  reason?: string;
  note?: string;
  userId?: string;
  createdAt?: string;
}

export interface CreateInventoryItemRequest {
  petId: string;
  itemName: string;
  category?: string;
  quantity?: number;
  unit?: string;
  lowThreshold?: number;
  expiryDate?: string;
}

export interface RestockInventoryRequest {
  petId: string;
  amount: number;
  unit?: string;
  inventoryItemId?: string;
}

export interface AdjustInventoryRequest {
  petId: string;
  currentStock: number;
  inventoryItemId?: string;
}
