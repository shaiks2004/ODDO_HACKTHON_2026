import { User, UserProfile, UserSettings } from '../../types/auth';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Marcus Vance',
    email: 'm.vance@stocksense.io',
    role: 'Inventory Manager',
    department: 'Supply Chain Operations',
    assignedWarehouse: 'Main Warehouse',
  },
  {
    id: 'user-2',
    name: 'Elena Rostova',
    email: 'e.rostova@stocksense.io',
    role: 'Warehouse Staff',
    department: 'Outbound Logistics',
    assignedWarehouse: 'Warehouse 1',
  },
  {
    id: 'user-3',
    name: 'David Chen',
    email: 'd.chen@stocksense.io',
    role: 'Warehouse Supervisor',
    department: 'Receiving & Quality',
    assignedWarehouse: 'Warehouse 2',
  },
];

export const defaultMockProfile: UserProfile = mockUsers[0];

export const defaultMockSettings: UserSettings = {
  defaultWarehouse: 'Main Warehouse',
  lowStockThreshold: 25,
  defaultUnit: 'kg',
  notificationsEnabled: true,
};
