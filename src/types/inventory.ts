export type ProductCategory = 'Raw Materials' | 'Components' | 'Finished Goods' | 'Packaging';

export type UnitOfMeasure = 'kg' | 'm' | 'pcs' | 'liters' | 'boxes' | 'sets' | 'rolls';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type OperationStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export type OperationType = 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment';

export interface Warehouse {
  id: string;
  name: string;
  shortCode: string; // e.g. MW-01
  address: string;
  manager?: string;
  phone?: string;
  createdAt?: string;
}

export interface Location {
  id: string;
  name: string;
  shortCode: string; // e.g. PR-01
  warehouseId: string;
  warehouseName: string;
  type?: 'Storage Rack' | 'Production Floor' | 'Receiving Dock' | 'Dispatch Bay';
  description?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unit: UnitOfMeasure;
  currentStock: number;
  onHand: number;
  freeToUse: number;
  reserved: number;
  reorderLevel: number;
  warehouseName: string;
  locationName: string;
  costPrice?: number;
  updatedAt: string;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitPrice?: number;
}

export interface Receipt {
  id: string;
  reference: string; // e.g. WH/IN/0001
  supplier: string;
  scheduleDate: string;
  warehouseId: string;
  warehouseName: string;
  status: OperationStatus;
  items: ReceiptItem[];
  notes?: string;
  createdAt: string;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: UnitOfMeasure;
}

export interface Delivery {
  id: string;
  reference: string; // e.g. WH/OUT/0001
  customer: string;
  scheduleDate: string;
  warehouseId: string;
  warehouseName: string;
  status: OperationStatus;
  items: DeliveryItem[];
  notes?: string;
  createdAt: string;
}

export interface InternalTransfer {
  id: string;
  reference: string; // e.g. WH/INT/0001
  fromWarehouse: string;
  fromLocation: string;
  toWarehouse: string;
  toLocation: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: UnitOfMeasure;
  status: OperationStatus;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface MoveHistoryEntry {
  id: string;
  reference: string; // e.g. WH/IN/0001
  date: string;      // e.g. 26/09/2026
  operation: OperationType;
  product: string;
  productId?: string;
  from: string;      // e.g. Supplier or Main Warehouse
  to: string;        // e.g. Main Warehouse or Customer
  quantity: number;
  unit: UnitOfMeasure;
  status: OperationStatus;
  user?: string;
}

export interface UserSettings {
  defaultWarehouse: string;
  lowStockThreshold: number;
  defaultUnit: UnitOfMeasure;
  notificationsEnabled: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  assignedWarehouse: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
