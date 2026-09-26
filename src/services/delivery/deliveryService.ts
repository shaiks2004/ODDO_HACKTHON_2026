import { DATA_SOURCE } from '../../config/dataSource';
import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Delivery, CreateDeliveryDTO, UpdateDeliveryDTO, ValidateDeliveryResult } from '../../types/delivery';
import { Product } from '../../types/product';
import { MoveHistoryEntry } from '../../types/movement';
import { mockDeliveries } from '../../data/mock/deliveries';
import { mockProducts } from '../../data/mock/products';
import { mockMovements } from '../../data/mock/movements';

export const deliveryService = {
  async getDeliveries(): Promise<Delivery[]> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Delivery[]>('/deliveries');
    }
    return storage.get<Delivery[]>(STORAGE_KEYS.DELIVERIES, mockDeliveries);
  },

  async getDeliveryById(id: string): Promise<Delivery | undefined> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Delivery>(`/deliveries/${id}`);
    }
    const list = storage.get<Delivery[]>(STORAGE_KEYS.DELIVERIES, mockDeliveries);
    return list.find((d) => d.id === id);
  },

  async createDelivery(dto: CreateDeliveryDTO): Promise<Delivery> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<Delivery>('/deliveries', dto);
    }
    const list = storage.get<Delivery[]>(STORAGE_KEYS.DELIVERIES, mockDeliveries);
    const newDelivery: Delivery = {
      ...dto,
      id: `del-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [newDelivery, ...list];
    storage.set(STORAGE_KEYS.DELIVERIES, updated);
    return newDelivery;
  },

  async updateDelivery(id: string, updates: UpdateDeliveryDTO): Promise<Delivery> {
    if (DATA_SOURCE === 'api') {
      return apiClient.put<Delivery>(`/deliveries/${id}`, updates);
    }
    const list = storage.get<Delivery[]>(STORAGE_KEYS.DELIVERIES, mockDeliveries);
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Delivery with id ${id} not found`);
    }
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    storage.set(STORAGE_KEYS.DELIVERIES, list);
    return updated;
  },

  async cancelDelivery(id: string): Promise<Delivery> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<Delivery>(`/deliveries/${id}/cancel`);
    }
    return this.updateDelivery(id, { status: 'Canceled' });
  },

  async validateDelivery(id: string): Promise<ValidateDeliveryResult> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<ValidateDeliveryResult>(`/deliveries/${id}/validate`);
    }

    const deliveries = storage.get<Delivery[]>(STORAGE_KEYS.DELIVERIES, mockDeliveries);
    const delivery = deliveries.find((d) => d.id === id);
    if (!delivery) {
      return { success: false, message: 'Delivery order not found' };
    }
    if (delivery.status === 'Done') {
      return { success: false, message: 'Delivery has already been validated and shipped.' };
    }

    const products = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);

    // Business Logic: Check stock availability. If requested quantity > available stock, reject!
    for (const item of delivery.items) {
      const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
      if (!prod) {
        return {
          success: false,
          message: `Product "${item.productName}" is not registered in the system stock master.`,
        };
      }
      if (item.quantity > prod.onHand) {
        return {
          success: false,
          message: `Insufficient stock for ${item.productName}. Requested ${item.quantity} ${item.unit}, but only ${prod.onHand} ${prod.unit} is on hand.`,
        };
      }
    }

    // Deduct stock and log movements
    const movements = storage.get<MoveHistoryEntry[]>(STORAGE_KEYS.MOVEMENTS, mockMovements);
    const newEntries: MoveHistoryEntry[] = [];
    const todayStr = new Date().toLocaleDateString('en-GB');

    delivery.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
      if (prod) {
        prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
        prod.onHand = Math.max(0, prod.onHand - item.quantity);
        prod.freeToUse = Math.max(0, prod.freeToUse - item.quantity);
        prod.updatedAt = todayStr;
      }

      newEntries.push({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        reference: delivery.reference,
        date: todayStr,
        operation: 'Delivery',
        product: item.productName,
        productId: item.productId,
        from: `${delivery.warehouseName} / ${prod?.locationName || 'General Stock'}`,
        to: delivery.customer,
        quantity: item.quantity,
        unit: item.unit,
        status: 'Done',
        user: 'Current User',
      });
    });

    delivery.status = 'Done';

    storage.set(STORAGE_KEYS.DELIVERIES, deliveries);
    storage.set(STORAGE_KEYS.PRODUCTS, products);
    storage.set(STORAGE_KEYS.MOVEMENTS, [...newEntries, ...movements]);

    return {
      success: true,
      message: `Delivery ${delivery.reference} validated. Physical stock deducted and dispatch logged.`,
    };
  },

  reset(): void {
    storage.set(STORAGE_KEYS.DELIVERIES, mockDeliveries);
  },
};
