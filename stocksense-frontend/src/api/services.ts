import type {
  Adjustment,
  Category,
  DashboardSummary,
  Delivery,
  InventoryProductSummary,
  InventoryRow,
  Location,
  LowStockAlert,
  MovementType,
  OperationStatus,
  Page,
  Product,
  Receipt,
  StockLedgerEntry,
  TokenResponse,
  Transfer,
  UnitOfMeasure,
  Warehouse,
} from '../types'
import { get, patch, post, queryString } from './client'

type ListQuery = { page?: number; page_size?: number; search?: string }
type StatusQuery = ListQuery & { status?: OperationStatus }

export const authApi = {
  login: (email: string, password: string) => post<TokenResponse>('/api/v1/auth/login', { email, password }),
  signup: (name: string, email: string, password: string) => post<TokenResponse>('/api/v1/auth/signup', { name, email, password }),
  forgotPassword: (email: string) => post<{ message: string }>('/api/v1/auth/forgot-password', { email }),
  resetPassword: (email: string, otp_code: string, new_password: string) => post<{ message: string }>('/api/v1/auth/reset-password', { email, otp_code, new_password }),
}

export const catalogApi = {
  categories: (query: ListQuery = {}) => get<Page<Category>>(`/api/v1/categories${queryString(query)}`),
  createCategory: (body: { name: string; description?: string | null }) => post<Category>('/api/v1/categories', body),
  updateCategory: (id: string, body: Partial<{ name: string; description: string | null }>) => patch<Category>(`/api/v1/categories/${id}`, body),
  products: (query: ListQuery & { category_id?: string; is_active?: boolean } = {}) => get<Page<Product>>(`/api/v1/products${queryString(query)}`),
  product: (id: string) => get<Product>(`/api/v1/products/${id}`),
  productInventory: (id: string) => get<InventoryProductSummary>(`/api/v1/inventory/${id}`),
  createProduct: (body: { name: string; sku: string; category_id: string; unit_of_measure: UnitOfMeasure; unit_cost?: string; reorder_level?: string; reorder_quantity?: string; barcode?: string | null }) => post<Product>('/api/v1/products', body),
  updateProduct: (id: string, body: Partial<{ name: string; sku: string; category_id: string; unit_cost: string; reorder_level: string; reorder_quantity: string; barcode: string | null; is_active: boolean }>) => patch<Product>(`/api/v1/products/${id}`, body),
  warehouses: (query: ListQuery & { is_active?: boolean } = {}) => get<Page<Warehouse>>(`/api/v1/warehouses${queryString(query)}`),
  createWarehouse: (body: { name: string; code: string; address?: string | null }) => post<Warehouse>('/api/v1/warehouses', body),
  updateWarehouse: (id: string, body: Partial<{ name: string; address: string | null; is_active: boolean }>) => patch<Warehouse>(`/api/v1/warehouses/${id}`, body),
  locations: (query: ListQuery & { warehouse_id?: string; is_active?: boolean } = {}) => get<Page<Location>>(`/api/v1/locations${queryString(query)}`),
  createLocation: (body: { warehouse_id: string; name: string; code: string }) => post<Location>('/api/v1/locations', body),
  updateLocation: (id: string, body: Partial<{ name: string; code: string; is_active: boolean }>) => patch<Location>(`/api/v1/locations/${id}`, body),
}

export const inventoryApi = {
  list: (query: ListQuery & { product_id?: string; warehouse_id?: string; location_id?: string; category_id?: string; low_stock?: boolean; out_of_stock?: boolean } = {}) => get<Page<InventoryRow>>(`/api/v1/inventory${queryString(query)}`),
}

export const operationsApi = {
  receipts: (query: StatusQuery = {}) => get<Page<Receipt>>(`/api/v1/receipts${queryString(query)}`),
  createReceipt: (body: { supplier_name: string; destination_location_id: string; scheduled_date?: string | null; items: { product_id: string; quantity: string }[] }) => post<Receipt>('/api/v1/receipts', body),
  validateReceipt: (id: string) => post<Receipt>(`/api/v1/receipts/${id}/validate`),
  cancelReceipt: (id: string) => post<Receipt>(`/api/v1/receipts/${id}/cancel`),
  deliveries: (query: StatusQuery = {}) => get<Page<Delivery>>(`/api/v1/deliveries${queryString(query)}`),
  createDelivery: (body: { customer_name: string; source_location_id: string; scheduled_date?: string | null; items: { product_id: string; quantity: string }[] }) => post<Delivery>('/api/v1/deliveries', body),
  prepareDelivery: (id: string) => post<Delivery>(`/api/v1/deliveries/${id}/prepare`),
  validateDelivery: (id: string) => post<Delivery>(`/api/v1/deliveries/${id}/validate`),
  cancelDelivery: (id: string) => post<Delivery>(`/api/v1/deliveries/${id}/cancel`),
  transfers: (query: StatusQuery = {}) => get<Page<Transfer>>(`/api/v1/transfers${queryString(query)}`),
  createTransfer: (body: { source_location_id: string; destination_location_id: string; scheduled_date?: string | null; items: { product_id: string; quantity: string }[] }) => post<Transfer>('/api/v1/transfers', body),
  validateTransfer: (id: string) => post<Transfer>(`/api/v1/transfers/${id}/validate`),
  cancelTransfer: (id: string) => post<Transfer>(`/api/v1/transfers/${id}/cancel`),
  adjustments: (query: StatusQuery & { product_id?: string } = {}) => get<Page<Adjustment>>(`/api/v1/adjustments${queryString(query)}`),
  createAdjustment: (body: { product_id: string; location_id: string; physical_quantity: string; reason: string }) => post<Adjustment>('/api/v1/adjustments', body),
  validateAdjustment: (id: string) => post<Adjustment>(`/api/v1/adjustments/${id}/validate`),
}

export const insightsApi = {
  dashboard: () => get<DashboardSummary>('/api/v1/dashboard'),
  alerts: (query: { product_id?: string; warehouse_id?: string; location_id?: string; category_id?: string; search?: string } = {}) => get<LowStockAlert[]>(`/api/v1/alerts/low-stock${queryString(query)}`),
  ledger: (query: ListQuery & { product_id?: string; location_id?: string; movement_type?: MovementType; date_from?: string; date_to?: string; reference_id?: string } = {}) => get<Page<StockLedgerEntry>>(`/api/v1/stock-ledger${queryString(query)}`),
  exportCsv: (report: 'stock' | 'movements' | 'receipts' | 'deliveries' | 'transfers' | 'adjustments', filters: Record<string, string | number | boolean | null | undefined> = {}) => `/api/v1/reports/${report}/export${queryString({ ...filters, format: 'csv' })}`,
}