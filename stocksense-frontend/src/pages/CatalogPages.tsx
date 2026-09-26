import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowRight, Boxes, ChevronDown, CirclePlus, Package, Pencil, Search, SlidersHorizontal } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { catalogApi, insightsApi, inventoryApi } from '../api/services'
import { download } from '../api/client'
import type { Category, InventoryProductSummary, InventoryRow, Location, LowStockAlert, Product, StockLedgerEntry, UnitOfMeasure, Warehouse } from '../types'
import { Badge, Button, Card, EmptyState, FormField, IconButton, LoadingRows, Modal, PageHeader, Skeleton, friendlyError, notify } from '../components/ui'
import { Pagination } from '../components/Pagination'

type CatalogKind = 'products' | 'categories' | 'warehouses' | 'locations'
type Entity = Product | Category | Warehouse | Location
const PAGE_SIZE = 10
const unitOptions: UnitOfMeasure[] = ['UNIT', 'KG', 'METER', 'LITER', 'PAIR', 'PACK']

function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timeout)
  }, [value, delay])
  return debounced
}

function asValue(record: Entity | null, key: string): string {
  if (!record || !(key in record)) return ''
  const value = (record as unknown as Record<string, unknown>)[key]
  return value === null || value === undefined ? '' : String(value)
}

export function CatalogPage({ kind }: { kind: CatalogKind }) {
  const [items, setItems] = useState<Entity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const searchTerm = useDebounced(search)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Entity | null>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const titles: Record<CatalogKind, [string, string, string]> = {
    products: ['Products', 'PRODUCT CATALOG', 'Manage product identifiers, units, and replenishment settings.'],
    categories: ['Categories', 'PRODUCT ORGANIZATION', 'Keep your product catalog grouped and easy to scan.'],
    warehouses: ['Warehouses', 'STORAGE NETWORK', 'Review your warehouse locations and operating status.'],
    locations: ['Locations', 'STORAGE NETWORK', 'Manage the places where inventory is held.'],
  }
  const [title, eyebrow, description] = titles[kind]

  useEffect(() => {
    setPage(1)
  }, [searchTerm, categoryFilter])

  useEffect(() => {
    let active = true
    setLoading(true)
    const query = { search: searchTerm || undefined, page, page_size: PAGE_SIZE }
    const load = kind === 'products' ? catalogApi.products({ ...query, category_id: categoryFilter || undefined })
      : kind === 'categories' ? catalogApi.categories(query)
        : kind === 'warehouses' ? catalogApi.warehouses(query)
          : catalogApi.locations(query)
    load.then((result) => {
      if (!active) return
      setItems(result.items)
      setTotal(result.total)
    }).catch((error) => { if (active) notify('error', friendlyError(error)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [kind, page, searchTerm, categoryFilter])

  useEffect(() => {
    let active = true
    Promise.allSettled([
      catalogApi.categories({ page: 1, page_size: 100 }),
      catalogApi.warehouses({ page: 1, page_size: 100 }),
      catalogApi.locations({ page: 1, page_size: 100 }),
    ]).then(([categoryResult, warehouseResult, locationResult]) => {
      if (!active) return
      if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value.items)
      if (warehouseResult.status === 'fulfilled') setWarehouses(warehouseResult.value.items)
      if (locationResult.status === 'fulfilled') setLocations(locationResult.value.items)
    })
    return () => { active = false }
  }, [])

  const warehouseMap = useMemo(() => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])), [warehouses])
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories])
  const locationCounts = useMemo(() => locations.reduce<Record<string, number>>((acc, location) => ({ ...acc, [location.warehouse_id]: (acc[location.warehouse_id] ?? 0) + 1 }), {}), [locations])

  function openCreate() {
    setEditing(null)
    setDraft({})
    setModalOpen(true)
  }

  function openEdit(item: Entity) {
    setEditing(item)
    const fields = kind === 'products' ? ['name', 'sku', 'category_id', 'unit_of_measure', 'unit_cost', 'reorder_level', 'reorder_quantity', 'barcode', 'is_active']
      : kind === 'categories' ? ['name', 'description']
        : kind === 'warehouses' ? ['name', 'address', 'is_active']
          : ['name', 'code', 'is_active']
    setDraft(Object.fromEntries(fields.map((field) => [field, asValue(item, field)])))
    setModalOpen(true)
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      if (kind === 'categories') {
        const payload = { name: draft.name, description: draft.description || null }
        if (editing) await catalogApi.updateCategory(editing.id, payload)
        else await catalogApi.createCategory(payload)
      } else if (kind === 'products') {
        const payload = {
          name: draft.name,
          sku: draft.sku,
          category_id: draft.category_id,
          unit_of_measure: draft.unit_of_measure as UnitOfMeasure,
          unit_cost: draft.unit_cost || '0',
          reorder_level: draft.reorder_level || '0',
          reorder_quantity: draft.reorder_quantity || '0',
          barcode: draft.barcode || null,
        }
        if (editing) await catalogApi.updateProduct(editing.id, { ...payload, is_active: draft.is_active === 'true' })
        else await catalogApi.createProduct(payload)
      } else if (kind === 'warehouses') {
        const payload = { name: draft.name, code: draft.code, address: draft.address || null }
        if (editing) await catalogApi.updateWarehouse(editing.id, { name: payload.name, address: payload.address, is_active: draft.is_active === 'true' })
        else await catalogApi.createWarehouse(payload)
      } else {
        const payload = { name: draft.name, code: draft.code }
        if (editing) await catalogApi.updateLocation(editing.id, { ...payload, is_active: draft.is_active === 'true' })
        else await catalogApi.createLocation({ ...payload, warehouse_id: draft.warehouse_id })
      }
      notify('success', `${kind.slice(0, -1)} ${editing ? 'updated' : 'created'}.`)
      setModalOpen(false)
      const result = kind === 'products' ? await catalogApi.products({ search: searchTerm || undefined, category_id: categoryFilter || undefined, page, page_size: PAGE_SIZE })
        : kind === 'categories' ? await catalogApi.categories({ search: searchTerm || undefined, page, page_size: PAGE_SIZE })
          : kind === 'warehouses' ? await catalogApi.warehouses({ search: searchTerm || undefined, page, page_size: PAGE_SIZE })
            : await catalogApi.locations({ search: searchTerm || undefined, page, page_size: PAGE_SIZE })
      setItems(result.items)
      setTotal(result.total)
    } catch (error) {
      notify('error', friendlyError(error))
    } finally {
      setSaving(false)
    }
  }

  const action = kind === 'products' || kind === 'categories' || kind === 'warehouses' || kind === 'locations'
    ? <Button icon={<CirclePlus size={17} />} onClick={openCreate}>Add {kind === 'products' ? 'product' : kind.slice(0, -1)}</Button>
    : null

  return <div className="page-stack">
    <PageHeader eyebrow={eyebrow} title={title} description={description} action={action} />
    <Card className="list-card">
      <div className="list-toolbar"><label className="list-search"><Search size={17} /><input aria-label={`Search ${title.toLowerCase()}`} placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>/</kbd></label>
        {kind === 'products' && <label className="filter-select"><SlidersHorizontal size={15} /><select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={14} /></label>}
        <span className="result-count">{loading ? 'Updating…' : `${total} ${total === 1 ? 'record' : 'records'}`}</span>
      </div>
      {loading ? <LoadingRows count={7} columns={kind === 'products' ? 6 : 4} /> : items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} found`} description={search ? 'Try a different search, or clear the filters.' : `Add your first ${kind === 'products' ? 'product' : kind.slice(0, -1)} to get started.`} action={!search ? <Button size="sm" icon={<CirclePlus size={15} />} onClick={openCreate}>Add {kind.slice(0, -1)}</Button> : undefined} /> : <div className="table-scroll"><table className="data-table catalog-table">
        {kind === 'products' ? <><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Unit</th><th>Reorder level</th><th>Status</th><th /></tr></thead><tbody>{(items as Product[]).map((product) => <tr key={product.id}><td><Link className="entity-link" to={`/products/${product.id}`}><span className="entity-icon product-entity"><Package size={17} /></span><span><strong>{product.name}</strong><small>{product.barcode || 'Catalog item'}</small></span></Link></td><td className="mono-cell">{product.sku}</td><td>{categoryMap.get(product.category_id) ?? '—'}</td><td>{product.unit_of_measure}</td><td>{quantity(product.reorder_level)}</td><td><Badge tone={product.is_active ? 'badge-active' : 'badge-canceled'}>{product.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge></td><td><IconButton label={`Edit ${product.name}`} onClick={() => openEdit(product)}><Pencil size={15} /></IconButton></td></tr>)}</tbody></>
          : kind === 'categories' ? <><thead><tr><th>Category</th><th>Description</th><th>Created</th><th /></tr></thead><tbody>{(items as Category[]).map((category) => <tr key={category.id}><td><span className="entity-link"><span className="entity-icon category-entity"><Boxes size={17} /></span><strong>{category.name}</strong></span></td><td>{category.description || '—'}</td><td>{date(category.created_at)}</td><td><IconButton label={`Edit ${category.name}`} onClick={() => openEdit(category)}><Pencil size={15} /></IconButton></td></tr>)}</tbody></>
            : kind === 'warehouses' ? <><thead><tr><th>Warehouse</th><th>Code</th><th>Locations</th><th>Address</th><th>Status</th><th /></tr></thead><tbody>{(items as Warehouse[]).map((warehouse) => <tr key={warehouse.id}><td><span className="entity-link"><span className="entity-icon warehouse-entity"><Boxes size={17} /></span><strong>{warehouse.name}</strong></span></td><td className="mono-cell">{warehouse.code}</td><td>{locationCounts[warehouse.id] ?? 0}</td><td>{warehouse.address || '—'}</td><td><Badge tone={warehouse.is_active ? 'badge-active' : 'badge-canceled'}>{warehouse.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge></td><td><IconButton label={`Edit ${warehouse.name}`} onClick={() => openEdit(warehouse)}><Pencil size={15} /></IconButton></td></tr>)}</tbody></>
              : <><thead><tr><th>Location</th><th>Code</th><th>Warehouse</th><th>Status</th><th /></tr></thead><tbody>{(items as Location[]).map((location) => <tr key={location.id}><td><span className="entity-link"><span className="entity-icon location-entity"><Boxes size={17} /></span><strong>{location.name}</strong></span></td><td className="mono-cell">{location.code}</td><td>{warehouseMap.get(location.warehouse_id)?.name ?? '—'}</td><td><Badge tone={location.is_active ? 'badge-active' : 'badge-canceled'}>{location.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge></td><td><IconButton label={`Edit ${location.name}`} onClick={() => openEdit(location)}><Pencil size={15} /></IconButton></td></tr>)}</tbody></>}
      </table></div>}
      {!loading && total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />}
    </Card>

    {modalOpen && <Modal title={`${editing ? 'Edit' : 'Add'} ${kind === 'products' ? 'product' : kind.slice(0, -1)}`} subtitle="Changes are saved to the StockSense catalog." onClose={() => setModalOpen(false)} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" form="entity-form" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create record'}</Button></>}>
      <form id="entity-form" className="form-grid" onSubmit={submitForm}>
        {kind === 'products' ? <>
          <FormField label="Product name"><input required maxLength={200} value={draft.name ?? ''} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Steel Rods" /></FormField>
          <FormField label="SKU"><input required maxLength={100} value={draft.sku ?? ''} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} placeholder="e.g. SS-STEEL-001" /></FormField>
          <FormField label="Category"><select required value={draft.category_id ?? ''} onChange={(event) => setDraft({ ...draft, category_id: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></FormField>
          <FormField label="Unit of measure"><select required value={draft.unit_of_measure ?? ''} onChange={(event) => setDraft({ ...draft, unit_of_measure: event.target.value })}><option value="">Select unit</option>{unitOptions.map((unit) => <option key={unit}>{unit}</option>)}</select></FormField>
          <FormField label="Reorder level"><input type="number" min="0" step="0.001" value={draft.reorder_level ?? '0'} onChange={(event) => setDraft({ ...draft, reorder_level: event.target.value })} /></FormField>
          <FormField label="Reorder quantity"><input type="number" min="0" step="0.001" value={draft.reorder_quantity ?? '0'} onChange={(event) => setDraft({ ...draft, reorder_quantity: event.target.value })} /></FormField>
          <FormField label="Unit cost"><input type="number" min="0" step="0.01" value={draft.unit_cost ?? '0'} onChange={(event) => setDraft({ ...draft, unit_cost: event.target.value })} /></FormField>
          <FormField label="Barcode"><input maxLength={100} value={draft.barcode ?? ''} onChange={(event) => setDraft({ ...draft, barcode: event.target.value })} placeholder="Optional" /></FormField>
          {editing && <FormField label="Status"><select value={draft.is_active ?? 'true'} onChange={(event) => setDraft({ ...draft, is_active: event.target.value })}><option value="true">Active</option><option value="false">Inactive</option></select></FormField>}
        </> : kind === 'categories' ? <><FormField label="Category name"><input required maxLength={100} value={draft.name ?? ''} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Raw materials" /></FormField><FormField label="Description"><textarea rows={3} value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="What belongs in this category?" /></FormField></>
          : kind === 'warehouses' ? <><FormField label="Warehouse name"><input required maxLength={150} value={draft.name ?? ''} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Warehouse name" /></FormField><FormField label="Short code"><input required maxLength={50} disabled={Boolean(editing)} value={draft.code ?? ''} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder="WH-MAIN" /></FormField><FormField label="Address"><textarea rows={2} value={draft.address ?? ''} onChange={(event) => setDraft({ ...draft, address: event.target.value })} placeholder="Address (optional)" /></FormField>{editing && <FormField label="Status"><select value={draft.is_active ?? 'true'} onChange={(event) => setDraft({ ...draft, is_active: event.target.value })}><option value="true">Active</option><option value="false">Inactive</option></select></FormField>}</>
            : <><FormField label="Warehouse"><select required disabled={Boolean(editing)} value={draft.warehouse_id ?? (editing as Location | null)?.warehouse_id ?? ''} onChange={(event) => setDraft({ ...draft, warehouse_id: event.target.value })}><option value="">Select warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></FormField><FormField label="Location name"><input required maxLength={150} value={draft.name ?? ''} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Main Stock" /></FormField><FormField label="Short code"><input required maxLength={80} value={draft.code ?? ''} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder="WH-MAIN-STOCK" /></FormField>{editing && <FormField label="Status"><select value={draft.is_active ?? 'true'} onChange={(event) => setDraft({ ...draft, is_active: event.target.value })}><option value="true">Active</option><option value="false">Inactive</option></select></FormField>}</>}
      </form>
    </Modal>}
  </div>
}

export function InventoryPage() {
  const [searchParams] = useSearchParams()
  const productFilter = searchParams.get('product_id') ?? ''
  const [items, setItems] = useState<InventoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const searchTerm = useDebounced(search)
  const [warehouse, setWarehouse] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [alertRows, setAlertRows] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setPage(1) }, [searchTerm, warehouse, location, category, stockFilter])
  useEffect(() => {
    let active = true
    setLoading(true)
    inventoryApi.list({ page, page_size: PAGE_SIZE, product_id: productFilter || undefined, search: searchTerm || undefined, warehouse_id: warehouse || undefined, location_id: location || undefined, category_id: category || undefined, low_stock: stockFilter === 'low' || undefined, out_of_stock: stockFilter === 'out' || undefined })
      .then((result) => { if (active) { setItems(result.items); setTotal(result.total) } })
      .catch((error) => { if (active) notify('error', friendlyError(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, searchTerm, warehouse, location, category, stockFilter, productFilter])
  useEffect(() => {
    Promise.allSettled([catalogApi.warehouses({ page: 1, page_size: 100 }), catalogApi.locations({ page: 1, page_size: 100 }), catalogApi.categories({ page: 1, page_size: 100 })]).then(([w, l, c]) => {
      if (w.status === 'fulfilled') setWarehouses(w.value.items)
      if (l.status === 'fulfilled') setLocations(l.value.items)
      if (c.status === 'fulfilled') setCategories(c.value.items)
    })
  }, [])
  useEffect(() => {
    insightsApi.alerts({ product_id: productFilter || undefined, warehouse_id: warehouse || undefined, location_id: location || undefined, category_id: category || undefined, search: searchTerm || undefined })
      .then(setAlertRows)
      .catch(() => setAlertRows([]))
  }, [productFilter, warehouse, location, category, searchTerm])
  const filteredLocations = warehouse ? locations.filter((entry) => entry.warehouse_id === warehouse) : locations
  const locationById = useMemo(() => new Map(locations.map((entry) => [entry.id, entry])), [locations])
  const warehouseById = useMemo(() => new Map(warehouses.map((entry) => [entry.id, entry])), [warehouses])
  const alertMap = useMemo(() => new Map(alertRows.map((entry) => [`${entry.product_id}:${entry.location_id}`, entry])), [alertRows])

  async function exportStock() {
    try {
      await download(insightsApi.exportCsv('stock', { warehouse_id: warehouse || undefined, location_id: location || undefined, category_id: category || undefined, search: searchTerm || undefined }), 'stocksense_stock_report.csv')
    } catch (error) { notify('error', friendlyError(error)) }
  }

  return <div className="page-stack"><PageHeader eyebrow="STOCK CONTROL" title="Inventory" description="Location-aware quantities with on-hand, reserved, and free-to-use visibility." action={<Button variant="secondary" icon={<ArrowDownToLine size={16} />} onClick={exportStock}>Export CSV</Button>} />
    <Card className="list-card inventory-list-card"><div className="list-toolbar inventory-toolbar"><label className="list-search"><Search size={17} /><input aria-label="Search inventory" placeholder="Search by product or SKU..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label className="filter-select"><select aria-label="Filter warehouse" value={warehouse} onChange={(event) => { setWarehouse(event.target.value); setLocation('') }}><option value="">All warehouses</option>{warehouses.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select><ChevronDown size={14} /></label>
      <label className="filter-select"><select aria-label="Filter location" value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{filteredLocations.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select><ChevronDown size={14} /></label>
      <label className="filter-select"><select aria-label="Filter category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select><ChevronDown size={14} /></label>
      <label className="filter-select status-select"><select aria-label="Filter stock status" value={stockFilter} onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)}><option value="all">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select><ChevronDown size={14} /></label>
    </div><div className="inventory-status-tabs"><button className={stockFilter === 'all' ? 'selected' : ''} onClick={() => setStockFilter('all')}>All stock</button><button className={stockFilter === 'low' ? 'selected' : ''} onClick={() => setStockFilter('low')}>Low stock</button><button className={stockFilter === 'out' ? 'selected' : ''} onClick={() => setStockFilter('out')}>Out of stock</button><span>{total} rows</span></div>
      {loading ? <LoadingRows count={8} columns={7} /> : items.length === 0 ? <EmptyState title="No inventory found" description="Change the filters or check whether products have stock recorded at these locations." /> : <div className="table-scroll"><table className="data-table inventory-table"><thead><tr><th>Product</th><th>Category</th><th>Warehouse / location</th><th>On hand</th><th>Reserved</th><th>Free to use</th><th>Status</th></tr></thead><tbody>{items.map((row) => {
        const onHand = Number(row.on_hand)
        const stockStatus = alertMap.get(`${row.product_id}:${row.location_id}`)?.stock_status ?? (onHand === 0 ? 'out_of_stock' : 'in_stock')
        const product = <Link className="inventory-product-link" to={`/products/${row.product_id}`}><strong>{row.product_name}</strong><small>{row.sku}</small></Link>
        return <tr key={`${row.product_id}:${row.location_id}`}><td>{product}</td><td>{row.category_name}</td><td><strong>{warehouseById.get(row.warehouse_id)?.name ?? row.warehouse_name}</strong><small className="table-secondary location-secondary">{locationById.get(row.location_id)?.name ?? row.location_name} · {row.location_code}</small></td><td className="numeric-cell">{quantity(row.on_hand)}</td><td className="numeric-cell muted-number">{quantity(row.reserved)}</td><td className="numeric-cell strong-number">{quantity(row.free_to_use)}</td><td><Badge>{stockStatus === 'out_of_stock' ? 'OUT OF STOCK' : stockStatus === 'low_stock' ? 'LOW STOCK' : 'IN STOCK'}</Badge></td></tr>
      })}</tbody></table></div>}
      {!loading && total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />}
    </Card>
  </div>
}

export function ProductDetailsPage() {
  const { productId = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [summary, setSummary] = useState<InventoryProductSummary | null>(null)
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    Promise.allSettled([catalogApi.product(productId), catalogApi.productInventory(productId), insightsApi.ledger({ product_id: productId, page: 1, page_size: 8 }), catalogApi.locations({ page: 1, page_size: 100 })]).then(([p, s, l, loc]) => {
      if (!active) return
      if (p.status === 'fulfilled') setProduct(p.value)
      if (s.status === 'fulfilled') setSummary(s.value)
      if (l.status === 'fulfilled') setLedger(l.value.items)
      if (loc.status === 'fulfilled') setLocations(loc.value.items)
      if (p.status === 'rejected') notify('error', friendlyError(p.reason))
      setLoading(false)
    })
    return () => { active = false }
  }, [productId])
  const [categoryNames, setCategoryNames] = useState<Category[]>([])
  useEffect(() => { catalogApi.categories({ page: 1, page_size: 100 }).then((result) => setCategoryNames(result.items)).catch(() => undefined) }, [])
  const categoryName = categoryNames.find((category) => category.id === product?.category_id)?.name ?? 'Product'
  const locationMap = new Map(locations.map((location) => [location.id, location.name]))
  if (loading) return <div className="page-stack"><Skeleton className="title-skeleton" /><div className="kpi-grid">{[0, 1, 2].map((item) => <Skeleton className="card-skeleton" key={item} />)}</div></div>
  if (!product) return <div className="page-stack"><PageHeader title="Product not found" description="This product may have been removed or is unavailable." /><Link to="/products" className="text-link">Back to products <ArrowRight size={14} /></Link></div>
  return <div className="page-stack"><PageHeader eyebrow={categoryName.toUpperCase()} title={product.name} description={`${product.sku} · ${product.unit_of_measure}`} action={<Link to={`/inventory?product_id=${product.id}`} className="button button-secondary">View inventory</Link>} />
    <div className="detail-summary-grid"><Card className="detail-main-card"><div className="detail-card-heading"><span className="entity-icon product-entity"><Package size={19} /></span><div><small>PRODUCT INFORMATION</small><h2>Catalog details</h2></div><Badge tone={product.is_active ? 'badge-active' : 'badge-canceled'}>{product.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge></div><div className="detail-fields"><div><span>SKU</span><strong>{product.sku}</strong></div><div><span>Category</span><strong>{categoryName}</strong></div><div><span>Unit of measure</span><strong>{product.unit_of_measure}</strong></div><div><span>Unit cost</span><strong>{quantity(product.unit_cost)}</strong></div><div><span>Reorder level</span><strong>{quantity(product.reorder_level)}</strong></div><div><span>Reorder quantity</span><strong>{quantity(product.reorder_quantity)}</strong></div></div></Card>
      <Card className="stock-totals-card"><div className="eyebrow">CURRENT STOCK</div><div className="stock-total-number">{quantity(summary?.total_on_hand)}</div><span className="stock-total-label">On hand · {product.unit_of_measure}</span><div className="stock-total-divider" /><div className="stock-total-pair"><span>Reserved</span><strong>{quantity(summary?.total_reserved)}</strong></div><div className="stock-total-pair"><span>Free to use</span><strong>{quantity(summary?.total_free_to_use)}</strong></div></Card></div>
    <Card><div className="section-heading"><div><div className="eyebrow">WAREHOUSE DISTRIBUTION</div><h2>Stock by location</h2></div><span className="result-count">{summary?.locations.length ?? 0} locations</span></div>{summary?.locations.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Warehouse</th><th>Location</th><th>On hand</th><th>Reserved</th><th>Free to use</th></tr></thead><tbody>{summary.locations.map((row) => <tr key={row.location_id}><td>{row.warehouse_name}</td><td>{locationMap.get(row.location_id) ?? row.location_name}</td><td>{quantity(row.on_hand)}</td><td>{quantity(row.reserved)}</td><td><strong>{quantity(row.free_to_use)}</strong></td></tr>)}</tbody></table></div> : <EmptyState title="No location balances" description="Inventory will appear after a stock movement is validated." />}</Card>
    <Card><div className="section-heading"><div><div className="eyebrow">AUDIT TRAIL</div><h2>Recent product movements</h2></div><Link to={`/movements?product_id=${product.id}`} className="text-link">All movements <ArrowRight size={14} /></Link></div>{ledger.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Type</th><th>Quantity</th><th>Location</th><th>Reference</th></tr></thead><tbody>{ledger.map((entry) => <tr key={entry.id}><td>{date(entry.created_at)}</td><td><Badge>{entry.movement_type.replaceAll('_', ' ')}</Badge></td><td>{Number(entry.quantity) > 0 ? '+' : ''}{quantity(entry.quantity)}</td><td>{locationMap.get(entry.destination_location_id ?? entry.source_location_id ?? '') ?? '—'}</td><td className="mono-cell">{entry.reference_id?.slice(0, 8) ?? '—'}</td></tr>)}</tbody></table></div> : <EmptyState title="No movement history" description="Validated stock operations will be recorded here." />}</Card>
  </div>
}

export function SettingsPage() {
  return <div className="page-stack"><PageHeader eyebrow="PREFERENCES" title="Settings" description="Connection and account details for this browser session." /><Card className="settings-card"><div className="settings-row"><div><strong>API connection</strong><p>Backend URL configured through the frontend environment.</p></div><Badge tone="badge-info">{import.meta.env.VITE_API_BASE_URL ? 'CONFIGURED' : 'SAME ORIGIN'}</Badge></div><div className="settings-row"><div><strong>Session storage</strong><p>Access and refresh tokens are held for this browser session only.</p></div><span className="settings-value">Session only</span></div><div className="settings-row"><div><strong>Profile management</strong><p>User profile endpoints are not available in the current backend contract.</p></div><span className="settings-value">Unavailable</span></div></Card></div>
}

function quantity(value: string | number | undefined) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value ?? 0)) }
function date(value: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) }