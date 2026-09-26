import { Product, UnitOfMeasure } from './product';

export interface StockItem extends Product {}

export interface StockTransferParams {
  productId: string;
  fromWarehouse: string;
  fromLocation: string;
  toWarehouse: string;
  toLocation: string;
  quantity: number;
  notes?: string;
}

export interface StockTransferResult {
  success: boolean;
  message?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  warehouseName: string;
  locationName: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  unit: UnitOfMeasure;
  reason: string;
  date: string;
}
