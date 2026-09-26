export type LocationType = 'Storage Rack' | 'Production Floor' | 'Receiving Dock' | 'Dispatch Bay';

export interface Location {
  id: string;
  name: string;
  shortCode: string; // e.g. PR-01
  warehouseId: string;
  warehouseName: string;
  type?: LocationType;
  description?: string;
  createdAt?: string;
}

export type CreateLocationDTO = Omit<Location, 'id' | 'createdAt'>;
export type UpdateLocationDTO = Partial<Omit<Location, 'id'>>;
