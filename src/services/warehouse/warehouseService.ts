import { DATA_SOURCE } from '../../config/dataSource';
import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Warehouse, CreateWarehouseDTO, UpdateWarehouseDTO } from '../../types/warehouse';
import { mockWarehouses } from '../../data/mock/warehouses';

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Warehouse[]>('/warehouses');
    }
    return storage.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, mockWarehouses);
  },

  async getWarehouseById(id: string): Promise<Warehouse | undefined> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Warehouse>(`/warehouses/${id}`);
    }
    const list = storage.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, mockWarehouses);
    return list.find((w) => w.id === id);
  },

  async createWarehouse(dto: CreateWarehouseDTO): Promise<Warehouse> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<Warehouse>('/warehouses', dto);
    }
    const list = storage.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, mockWarehouses);
    const newWh: Warehouse = {
      ...dto,
      id: `wh-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [...list, newWh];
    storage.set(STORAGE_KEYS.WAREHOUSES, updated);
    return newWh;
  },

  async updateWarehouse(id: string, updates: UpdateWarehouseDTO): Promise<Warehouse> {
    if (DATA_SOURCE === 'api') {
      return apiClient.put<Warehouse>(`/warehouses/${id}`, updates);
    }
    const list = storage.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, mockWarehouses);
    const index = list.findIndex((w) => w.id === id);
    if (index === -1) {
      throw new Error(`Warehouse with id ${id} not found`);
    }
    const updatedWh = { ...list[index], ...updates };
    list[index] = updatedWh;
    storage.set(STORAGE_KEYS.WAREHOUSES, list);
    return updatedWh;
  },

  async deleteWarehouse(id: string): Promise<boolean> {
    if (DATA_SOURCE === 'api') {
      await apiClient.delete(`/warehouses/${id}`);
      return true;
    }
    const list = storage.get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, mockWarehouses);
    const filtered = list.filter((w) => w.id !== id);
    storage.set(STORAGE_KEYS.WAREHOUSES, filtered);
    return true;
  },

  reset(): void {
    storage.set(STORAGE_KEYS.WAREHOUSES, mockWarehouses);
  },
};
