export type UUID = string
export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED'
export type MovementType = 'INITIAL_STOCK' | 'RECEIPT' | 'DELIVERY' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT'
export type UnitOfMeasure = 'UNIT' | 'KG' | 'METER' | 'LITER' | 'PAIR' | 'PACK'
export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'

export interface Page<T> {
  items: T[]
  page: number
  page_size: number
  total: number
}

export interface User {
  id: UUID
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: UUID
  name: string
  description: string | null
  created_at: string
}

export interface Product {
  id: UUID
  name: string
  sku: string
  category_id: UUID
  unit_of_measure: UnitOfMeasure
  unit_cost: string
  reorder_level: string
  reorder_quantity: string
  barcode: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Warehouse {
  id: UUID
  name: string
  code: string
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: UUID
  warehouse_id: UUID
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export interface InventoryRow {
  product_id: UUID
  product_name: string
  sku: string
  category_id: UUID
  category_name: string
  warehouse_id: UUID
  warehouse_name: string
  location_id: UUID
  location_name: string
  location_code: string
  on_hand: string
  reserved: string
  free_to_use: string
}

export interface InventoryProductSummary {
  product_id: UUID
  product_name: string
  sku: string
  locations: InventoryRow[]
  total_on_hand: string
  total_reserved: string
  total_free_to_use: string
}

export interface OperationItem {
  id: UUID
  product_id: UUID
  quantity: string
  created_at: string
}

export interface Receipt {
  id: UUID
  reference: string
  supplier_name: string
  destination_location_id: UUID
  scheduled_date: string | null
  status: OperationStatus
  created_by: UUID
  created_at: string
  updated_at: string
  items: OperationItem[]
}

export interface Delivery {
  id: UUID
  reference: string
  customer_name: string
  source_location_id: UUID
  scheduled_date: string | null
  status: OperationStatus
  created_by: UUID
  created_at: string
  updated_at: string
  items: OperationItem[]
}

export interface Transfer {
  id: UUID
  reference: string
  source_location_id: UUID
  destination_location_id: UUID
  scheduled_date: string | null
  status: OperationStatus
  created_by: UUID
  created_at: string
  updated_at: string
  items: OperationItem[]
}

export interface Adjustment {
  id: UUID
  reference: string
  product_id: UUID
  location_id: UUID
  system_quantity: string
  physical_quantity: string
  difference: string
  reason: string
  status: OperationStatus
  created_by: UUID
  created_at: string
  updated_at: string
}

export interface StockLedgerEntry {
  id: UUID
  product_id: UUID
  source_location_id: UUID | null
  destination_location_id: UUID | null
  movement_type: MovementType
  quantity: string
  reference_type: string
  reference_id: UUID | null
  created_by: UUID | null
  created_at: string
}

export interface LowStockAlert {
  product_id: UUID
  product_name: string
  sku: string
  location_id: UUID
  location_name: string
  location_code: string
  warehouse_id: UUID
  warehouse_name: string
  on_hand: string
  reserved: string
  free_to_use: string
  reorder_level: string
  reorder_quantity: string
  suggested_reorder_quantity: string
  stock_status: 'low_stock' | 'out_of_stock'
}

export interface OperationBreakdown {
  pending: number
  late: number
  waiting: number
  to_receive?: number
  to_deliver?: number
}

export interface DashboardSummary {
  total_products_in_stock: number
  low_stock_count: number
  out_of_stock_count: number
  pending_receipts: OperationBreakdown
  pending_deliveries: OperationBreakdown
  scheduled_transfers: number
}

export interface DashboardWarehouseTotal {
  warehouse_id: UUID
  warehouse_name: string
  location_count: number
  product_count: number
  on_hand: string
  reserved: string
  free_to_use: string
  stock_value: string
}

export interface DashboardLocationTotal {
  location_id: UUID
  location_name: string
  location_code: string
  warehouse_id: UUID
  warehouse_name: string
  product_count: number
  on_hand: string
  reserved: string
  free_to_use: string
  stock_value: string
}

export interface AdvancedDashboardSummary {
  total_products: number
  active_products: number
  low_stock_products: number
  out_of_stock_products: number
  total_on_hand: string
  total_reserved: string
  total_free_to_use: string
  total_stock_value: string
  pending_receipts: number
  late_receipts: number
  waiting_receipts: number
  pending_deliveries: number
  late_deliveries: number
  waiting_deliveries: number
  scheduled_transfers: number
  ready_transfers: number
  warehouses: DashboardWarehouseTotal[]
  locations: DashboardLocationTotal[]
  recent_movements: StockLedgerEntry[]
}

export interface StockValuationRow {
  warehouse_id: UUID
  warehouse_name: string
  total_on_hand: string
  total_reserved: string
  total_free_to_use: string
  distinct_products: number
  total_stock_value: string
}

export interface MovementVolumeRow {
  movement_type: MovementType
  movement_count: number
  quantity_volume: string
}

export interface ProductMovementRank {
  product_id: UUID
  product_name: string
  sku: string
  unit_of_measure: UnitOfMeasure
  movement_count: number
  movement_volume: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  refresh_token: string | null
}

export interface SignupResponse {
  message: string
  email: string
  requires_verification: boolean
}