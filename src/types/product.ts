export type ProductCategory = 'Raw Materials' | 'Components' | 'Finished Goods' | 'Packaging';

export type UnitOfMeasure = 'kg' | 'm' | 'pcs' | 'liters' | 'boxes' | 'sets' | 'rolls';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unit: UnitOfMeasure;
  currentStock: number;
  onHand: number;
  freeToUse: number;
  reserved: number;
  reorderLevel: number;
  warehouseName: string;
  locationName: string;
  costPrice?: number;
  updatedAt: string;
}

export type CreateProductDTO = Omit<Product, 'id' | 'updatedAt'>;
export type UpdateProductDTO = Partial<Omit<Product, 'id'>>;
