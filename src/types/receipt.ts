import { UnitOfMeasure } from './product';
import { OperationStatus } from './movement';

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

export type CreateReceiptDTO = Omit<Receipt, 'id' | 'createdAt'>;
export type UpdateReceiptDTO = Partial<Omit<Receipt, 'id'>>;

export interface ValidateReceiptResult {
  success: boolean;
  message?: string;
}
