import { Warehouse } from '../../types/warehouse';

export const mockWarehouses: Warehouse[] = [
  {
    id: 'wh-1',
    name: 'Main Warehouse',
    shortCode: 'MW-01',
    address: 'Industrial Area, Sector 9',
    manager: 'Marcus Vance',
    phone: '+1 (555) 234-8901',
    createdAt: '2026-01-10',
  },
  {
    id: 'wh-2',
    name: 'Warehouse 1',
    shortCode: 'W1-02',
    address: 'East Logistics Terminal, Bay 14',
    manager: 'Elena Rostova',
    phone: '+1 (555) 234-8902',
    createdAt: '2026-02-15',
  },
  {
    id: 'wh-3',
    name: 'Warehouse 2',
    shortCode: 'W2-03',
    address: 'South Freight Yard, Dock 5',
    manager: 'David Chen',
    phone: '+1 (555) 234-8903',
    createdAt: '2026-03-20',
  },
  {
    id: 'wh-4',
    name: 'Production Floor',
    shortCode: 'PF-04',
    address: 'Assembly Plant Block B',
    manager: 'Sarah Jenkins',
    phone: '+1 (555) 234-8904',
    createdAt: '2026-04-05',
  },
];
