export * from './auth';
export * from './product';
export * from './stock';
export * from './warehouse';
export * from './location';
export * from './receipt';
export * from './delivery';
export * from './movement';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface InternalTransfer {
  id: string;
  reference: string;
  fromWarehouse: string;
  fromLocation: string;
  toWarehouse: string;
  toLocation: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: import('./product').UnitOfMeasure;
  status: import('./movement').OperationStatus;
  date: string;
  notes?: string;
  createdAt: string;
}
