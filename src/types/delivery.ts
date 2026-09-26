import { UnitOfMeasure } from './product';
import { OperationStatus } from './movement';

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

export type CreateDeliveryDTO = Omit<Delivery, 'id' | 'createdAt'>;
export type UpdateDeliveryDTO = Partial<Omit<Delivery, 'id'>>;

export interface ValidateDeliveryResult {
  success: boolean;
  message?: string;
}
