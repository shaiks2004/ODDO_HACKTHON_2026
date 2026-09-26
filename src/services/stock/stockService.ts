import { DATA_SOURCE } from '../../config/dataSource';
import { apiClient } from '../../lib/apiClient';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Product, CreateProductDTO, UpdateProductDTO } from '../../types/product';
import { StockTransferParams, StockTransferResult } from '../../types/stock';
import { mockProducts } from '../../data/mock/products';

export const stockService = {
  async getProducts(): Promise<Product[]> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Product[]>('/products');
    }
    return storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
  },

  async getProductById(id: string): Promise<Product | undefined> {
    if (DATA_SOURCE === 'api') {
      return apiClient.get<Product>(`/products/${id}`);
    }
    const list = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    return list.find((p) => p.id === id);
  },

  async createProduct(dto: CreateProductDTO): Promise<Product> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<Product>('/products', dto);
    }
    const list = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const newProd: Product = {
      ...dto,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toLocaleDateString('en-GB'),
    };
    const updated = [...list, newProd];
    storage.set(STORAGE_KEYS.PRODUCTS, updated);
    return newProd;
  },

  async updateProduct(id: string, updates: UpdateProductDTO): Promise<Product> {
    if (DATA_SOURCE === 'api') {
      return apiClient.put<Product>(`/products/${id}`, updates);
    }
    const list = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    const updatedProd: Product = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toLocaleDateString('en-GB'),
    };
    list[index] = updatedProd;
    storage.set(STORAGE_KEYS.PRODUCTS, list);
    return updatedProd;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (DATA_SOURCE === 'api') {
      await apiClient.delete(`/products/${id}`);
      return true;
    }
    const list = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const filtered = list.filter((p) => p.id !== id);
    storage.set(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  async transferStock(params: StockTransferParams): Promise<StockTransferResult> {
    if (DATA_SOURCE === 'api') {
      return apiClient.post<StockTransferResult>('/stock/transfer', params);
    }

    const list = storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts);
    const prod = list.find((p) => p.id === params.productId);
    if (!prod) {
      return { success: false, message: 'Product not found in stock master.' };
    }
    if (params.quantity > prod.onHand) {
      return {
        success: false,
        message: `Insufficient on-hand stock (${prod.onHand} ${prod.unit} available).`,
      };
    }

    // Business Logic: Internal Move reallocates location without changing total inventory
    prod.warehouseName = params.toWarehouse;
    prod.locationName = params.toLocation;
    prod.updatedAt = new Date().toLocaleDateString('en-GB');

    storage.set(STORAGE_KEYS.PRODUCTS, list);
    return {
      success: true,
      message: `Successfully transferred ${params.quantity} ${prod.unit} of ${prod.name} to ${params.toWarehouse} (${params.toLocation}).`,
    };
  },

  reset(): void {
    storage.set(STORAGE_KEYS.PRODUCTS, mockProducts);
  },
};
