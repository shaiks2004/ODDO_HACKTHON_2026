import { DATA_SOURCE } from '../../config/dataSource';
import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Receipt, CreateReceiptDTO, UpdateReceiptDTO, ValidateReceiptResult } from '../../types/receipt';
import { Product } from '../../types/product';
import { MoveHistoryEntry } from '../../types/movement';
import { mockReceipts } from '../../data/mock/receipts';
import { mockProducts } from '../../data/mock/products';
import { mockMovements } from '../../data/mock/movements';

export const receiptService = {
  async getReceipts(): Promise<Receipt[]> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Receipt[]>('/receipts');
    }
    return storage.get<Receipt[]>(STORAGE_KEYS.RECEIPTS, mockReceipts);
  },

  async getReceiptById(id: string): Promise<Receipt | undefined> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Receipt>(`/receipts/${id}`);
    }
    const list = storage.get<Receipt[]>(STORAGE_KEYS.RECEIPTS, mockReceipts);
    return list.find((r) => r.id === id);
  },

  async createReceipt(dto: CreateReceiptDTO): Promise<Receipt> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<Receipt>('/receipts', dto);
    }
    const list = storage.get<Receipt[]>(STORAGE_KEYS.RECEIPTS, mockReceipts);
    const newReceipt: Receipt = {
      ...dto,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [newReceipt, ...list];
    storage.set(STORAGE_KEYS.RECEIPTS, updated);
    return newReceipt;
  },

  async updateReceipt(id: string, updates: UpdateReceiptDTO): Promise<Receipt> {
    if (DATA_SOURCE === 'api') {
      return apiClient.put<Receipt>(`/receipts/${id}`, updates);
    }
    const list = storage.get<Receipt[]>(STORAGE_KEYS.RECEIPTS, mockReceipts);
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Receipt with id ${id} not found`);
    }
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    storage.set(STORAGE_KEYS.RECEIPTS, list);
    return updated;
  },

  async cancelReceipt(id: string): Promise<Receipt> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<Receipt>(`/receipts/${id}/cancel`);
    }
    return this.updateReceipt(id, { status: 'Canceled' });
  },

  async validateReceipt(id: string): Promise<ValidateReceiptResult> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<ValidateReceiptResult>(`/receipts/${id}/validate`);
    }

    const receipts = storage.get<Receipt[]>(STORAGE_KEYS.RECEIPTS, mockReceipts);
    const receipt = receipts.find((r) => r.id === id);
    if (!receipt) {
      return { success: false, message: 'Receipt not found' };
    }
    if (receipt.status === 'Done') {
      return { success: false, message: 'Receipt has already been validated and posted.' };
    }

    // Business Logic: Increase physical stock for each received product item
    const products = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const movements = storage.get<MoveHistoryEntry[]>(STORAGE_KEYS.MOVEMENTS, mockMovements);
    const newEntries: MoveHistoryEntry[] = [];
    const todayStr = new Date().toLocaleDateString('en-GB');

    receipt.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
      if (prod) {
        prod.currentStock += item.quantity;
        prod.onHand += item.quantity;
        prod.freeToUse += item.quantity;
        prod.updatedAt = todayStr;
      }

      newEntries.push({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        reference: receipt.reference,
        date: todayStr,
        operation: 'Receipt',
        product: item.productName,
        productId: item.productId,
        from: receipt.supplier,
        to: `${receipt.warehouseName} / ${prod?.locationName || 'General Receiving'}`,
        quantity: item.quantity,
        unit: item.unit,
        status: 'Done',
        user: 'Current User',
      });
    });

    receipt.status = 'Done';

    storage.set(STORAGE_KEYS.RECEIPTS, receipts);
    storage.set(STORAGE_KEYS.PRODUCTS, products);
    storage.set(STORAGE_KEYS.MOVEMENTS, [...newEntries, ...movements]);

    return {
      success: true,
      message: `Receipt ${receipt.reference} validated. Stock balances increased and movement logged.`,
    };
  },

  reset(): void {
    storage.set(STORAGE_KEYS.RECEIPTS, mockReceipts);
  },
};
