import { UnitOfMeasure } from './product';

export type OperationStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export type OperationType = 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment';

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

export type StockMovement = MoveHistoryEntry;
