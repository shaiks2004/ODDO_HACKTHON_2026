import { DATA_SOURCE } from '../../config/dataSource';
import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Location, CreateLocationDTO, UpdateLocationDTO } from '../../types/location';
import { mockLocations } from '../../data/mock/locations';

export const locationService = {
  async getLocations(): Promise<Location[]> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Location[]>('/locations');
    }
    return storage.get<Location[]>(STORAGE_KEYS.LOCATIONS, mockLocations);
  },

  async getLocationById(id: string): Promise<Location | undefined> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Location>(`/locations/${id}`);
    }
    const list = storage.get<Location[]>(STORAGE_KEYS.LOCATIONS, mockLocations);
    return list.find((l) => l.id === id);
  },

  async getLocationsByWarehouse(warehouseId: string): Promise<Location[]> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Location[]>(`/warehouses/${warehouseId}/locations`);
    }
    const list = storage.get<Location[]>(STORAGE_KEYS.LOCATIONS, mockLocations);
    return list.filter((l) => l.warehouseId === warehouseId);
  },

  async createLocation(dto: CreateLocationDTO): Promise<Location> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<Location>('/locations', dto);
    }
    const list = storage.get<Location[]>(STORAGE_KEYS.LOCATIONS, mockLocations);
    const newLoc: Location = {
      ...dto,
      id: `loc-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [...list, newLoc];
    storage.set(STORAGE_KEYS.LOCATIONS, updated);
    return newLoc;
  },

  async updateLocation(id: string, updates: UpdateLocationDTO): Promise<Location> {
    if (DATA_SOURCE === 'api') {
      return apiClient.put<Location>(`/locations/${id}`, updates);
    }
    const list = storage.get<Location[]>(STORAGE_KEYS.LOCATIONS, mockLocations);
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error(`Location with id ${id} not found`);
    }
    const updatedLoc = { ...list[index], ...updates };
    list[index] = updatedLoc;
    storage.set(STORAGE_KEYS.LOCATIONS, list);
    return updatedLoc;
  },

  async deleteLocation(id: string): Promise<boolean> {
    if (DATA_SOURCE === 'api') {
      await apiClient.delete(`/locations/${id}`);
      return true;
    }
    const list = storage.get<Location[]>(STORAGE_KEYS.LOCATIONS, mockLocations);
    const filtered = list.filter((l) => l.id !== id);
    storage.set(STORAGE_KEYS.LOCATIONS, filtered);
    return true;
  },

  reset(): void {
    storage.set(STORAGE_KEYS.LOCATIONS, mockLocations);
  },
};
