export interface Warehouse {
  id: string;
  name: string;
  shortCode: string; // e.g. MW-01
  address: string;
  manager?: string;
  phone?: string;
  createdAt?: string;
}

export type CreateWarehouseDTO = Omit<Warehouse, 'id' | 'createdAt'>;
export type UpdateWarehouseDTO = Partial<Omit<Warehouse, 'id'>>;
