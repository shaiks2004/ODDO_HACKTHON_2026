import { Delivery } from '../../types/delivery';

export const mockDeliveries: Delivery[] = [
  {
    id: 'del-1',
    reference: 'WH/OUT/0001',
    customer: 'Precision Machining Ltd',
    scheduleDate: '26/09/2026',
    warehouseId: 'wh-1',
    warehouseName: 'Main Warehouse',
    status: 'Ready',
    items: [
      {
        productId: 'prod-1',
        productName: 'Steel Rods',
        sku: 'STL-001',
        quantity: 40,
        unit: 'kg',
      },
    ],
    notes: 'Outbound dispatch via Express Carrier. Awaiting dock gate assignment.',
    createdAt: '2026-09-24',
  },
  {
    id: 'del-2',
    reference: 'WH/OUT/0002',
    customer: 'Horizon Robotics Inc',
    scheduleDate: '28/09/2026',
    warehouseId: 'wh-2',
    warehouseName: 'Warehouse 1',
    status: 'Waiting',
    items: [
      {
        productId: 'prod-3',
        productName: 'Microcontroller IC',
        sku: 'MIC-902',
        quantity: 250,
        unit: 'pcs',
      },
      {
        productId: 'prod-5',
        productName: 'Hydraulic Valve Set',
        sku: 'VAL-331',
        quantity: 15,
        unit: 'sets',
      },
    ],
    notes: 'Scheduled for Friday consolidated pickup.',
    createdAt: '2026-09-24',
  },
  {
    id: 'del-3',
    reference: 'WH/OUT/0003',
    customer: 'Vanguard Industrial Co',
    scheduleDate: '24/09/2026',
    warehouseId: 'wh-3',
    warehouseName: 'Warehouse 2',
    status: 'Done',
    items: [
      {
        productId: 'prod-7',
        productName: 'Thermal Heat Sink Assembly',
        sku: 'HSK-104',
        quantity: 80,
        unit: 'pcs',
      },
    ],
    notes: 'Freight signed and dispatched from dock 5.',
    createdAt: '2026-09-21',
  },
];
