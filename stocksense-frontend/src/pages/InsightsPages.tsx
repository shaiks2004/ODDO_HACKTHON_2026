import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowRight, ChevronDown, Download, Filter, Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { catalogApi, insightsApi } from '../api/services'
import { download } from '../api/client'
import type { Location, LowStockAlert, MovementType, Product, StockLedgerEntry, Warehouse } from '../types'
import { Badge, Button, Card, EmptyState, LoadingRows, PageHeader, friendlyError, notify } from '../components/ui'
import { Pagination } from '../components/Pagination'

const PAGE_SIZE = 12
const movementTypes: MovementType[] = ['INITIAL_STOCK', 'RECEIPT', 'DELIVERY', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT']

function formatQuantity(value: string | number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [search, setSearch] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  useEffect(() => { catalogApi.warehouses({ page: 1, page_size: 100 }).then((result) => setWarehouses(result.items)).catch(() => undefined) }, [])
  useEffect(() => {
    let active = true
    setLoading(true)
    insightsApi.alerts({ search: search || undefined, warehouse_id: warehouse || undefined })
      .then((result) => { if (active) setAlerts(result.filter((alert) => !status || alert.stock_status === status)) })
      .catch((error) => { if (active) notify('error', friendlyError(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, warehouse, status])
  useEffect(() => { setPage(1) }, [search, warehouse, status])
  const visible = alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const countOut = alerts.filter((alert) => alert.stock_status === 'out_of_stock').length

  return <div className="page-stack"><PageHeader eyebrow="REPLENISHMENT" title="Low-stock alerts" description="Every product-location balance at or below its configured reorder level." action={<span className="alert-summary-pill"><i /> {loading ? 'Checking levels' : `${alerts.length} need attention`}</span>} />
    <div className="alert-intro-strip"><span className="alert-intro-icon"><SlidersHorizontal size={17} /></span><p><strong>Reorder suggestions</strong> use each product’s configured reorder quantity or the current stock shortfall, whichever is greater.</p><span className="alert-out-count">{countOut} out of stock</span></div>
    <Card className="list-card"><div className="list-toolbar"><label className="list-search"><Search size={17} /><input aria-label="Search low-stock alerts" placeholder="Search product or SKU..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="filter-select"><select aria-label="Filter by warehouse" value={warehouse} onChange={(event) => setWarehouse(event.target.value)}><option value="">All warehouses</option>{warehouses.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select><ChevronDown size={14} /></label><label className="filter-select"><select aria-label="Filter alert status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All alerts</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select><ChevronDown size={14} /></label><span className="result-count">{loading ? 'Updating…' : `${alerts.length} locations`}</span></div>
      {loading ? <LoadingRows count={6} columns={5} /> : visible.length === 0 ? <EmptyState title={search || status || warehouse ? 'No matching alerts' : 'No low-stock products'} description={search || status || warehouse ? 'Change a filter to view other stock alerts.' : 'Stock is above the configured reorder levels across tracked locations.'} /> : <div className="table-scroll"><table className="data-table alerts-table"><thead><tr><th>Product</th><th>Warehouse / location</th><th>On hand</th><th>Reserved</th><th>Reorder level</th><th>Suggested quantity</th><th>Status</th><th /></tr></thead><tbody>{visible.map((alert) => <tr key={`${alert.product_id}:${alert.location_id}`}><td><Link className="inventory-product-link" to={`/products/${alert.product_id}`}><strong>{alert.product_name}</strong><small>{alert.sku}</small></Link></td><td><strong>{alert.warehouse_name}</strong><small className="table-secondary location-secondary">{alert.location_name} · {alert.location_code}</small></td><td className="numeric-cell">{formatQuantity(alert.on_hand)}</td><td className="numeric-cell muted-number">{formatQuantity(alert.reserved)}</td><td className="numeric-cell">{formatQuantity(alert.reorder_level)}</td><td className="numeric-cell suggested-quantity">{formatQuantity(alert.suggested_reorder_quantity)}</td><td><Badge>{alert.stock_status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}</Badge></td><td><Link className="icon-button" aria-label={`View inventory for ${alert.product_name}`} title="View inventory" to={`/inventory?product_id=${alert.product_id}`}><ArrowRight size={15} /></Link></td></tr>)}</tbody></table></div>}
      {!loading && alerts.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={alerts.length} onChange={setPage} />}
    </Card>
  </div>
}

export function MovementHistoryPage() {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([])
  const [total, setTotal] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [page, setPage] = useState(1)
  const [product, setProduct] = useState('')
  const [location, setLocation] = useState('')
  const [movement, setMovement] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { Promise.allSettled([catalogApi.products({ page: 1, page_size: 100 }), catalogApi.locations({ page: 1, page_size: 100 }), catalogApi.warehouses({ page: 1, page_size: 100 })]).then(([p, l, w]) => { if (p.status === 'fulfilled') setProducts(p.value.items); if (l.status === 'fulfilled') setLocations(l.value.items); if (w.status === 'fulfilled') setWarehouses(w.value.items) }) }, [])
  useEffect(() => {
    let active = true
    setLoading(true)
    insightsApi.ledger({ page, page_size: PAGE_SIZE, product_id: product || undefined, location_id: location || undefined, movement_type: movement ? movement as MovementType : undefined, date_from: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined, date_to: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined })
      .then((result) => { if (active) { setEntries(result.items); setTotal(result.total) } })
      .catch((error) => { if (active) notify('error', friendlyError(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, product, location, movement, dateFrom, dateTo])
  useEffect(() => { setPage(1) }, [product, location, movement, dateFrom, dateTo])
  const productMap = useMemo(() => new Map(products.map((entry) => [entry.id, entry])), [products])
  const locationMap = useMemo(() => new Map(locations.map((entry) => [entry.id, entry])), [locations])
  const warehouseMap = useMemo(() => new Map(warehouses.map((entry) => [entry.id, entry.name])), [warehouses])
  const canExport = async () => {
    try { await download(insightsApi.exportCsv('movements', { product_id: product || undefined, location_id: location || undefined, movement_type: movement || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined }), 'stocksense_movements_report.csv') }
    catch (error) { notify('error', friendlyError(error)) }
  }
  const locationLabel = (id: string | null) => {
    if (!id) return '—'
    const entry = locationMap.get(id)
    return entry ? `${warehouseMap.get(entry.warehouse_id) ?? ''} · ${entry.name}` : '—'
  }

  return <div className="page-stack"><PageHeader eyebrow="AUDIT TRAIL" title="Movement history" description="A read-only record of validated changes to stock by product and location." action={<Button variant="secondary" icon={<ArrowDownToLine size={16} />} onClick={canExport}>Export CSV</Button>} />
    <Card className="list-card"><div className="filter-panel-heading"><span><Filter size={15} /> Filter ledger</span><span>Newest first</span></div><div className="ledger-filters">
      <label className="filter-select"><select aria-label="Filter by product" value={product} onChange={(event) => setProduct(event.target.value)}><option value="">All products</option>{products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.sku}</option>)}</select><ChevronDown size={14} /></label>
      <label className="filter-select"><select aria-label="Filter by location" value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{locations.map((entry) => <option key={entry.id} value={entry.id}>{warehouseMap.get(entry.warehouse_id) ?? ''} · {entry.name}</option>)}</select><ChevronDown size={14} /></label>
      <label className="filter-select"><select aria-label="Filter movement type" value={movement} onChange={(event) => setMovement(event.target.value)}><option value="">All movement types</option>{movementTypes.map((entry) => <option value={entry} key={entry}>{entry.replaceAll('_', ' ')}</option>)}</select><ChevronDown size={14} /></label>
      <label className="filter-date"><span>From</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label className="filter-date"><span>To</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
    </div><div className="list-toolbar ledger-result-bar"><span className="result-count">{loading ? 'Loading ledger…' : `${total} movement records`}</span>{(product || location || movement || dateFrom || dateTo) && <button className="clear-filters" onClick={() => { setProduct(''); setLocation(''); setMovement(''); setDateFrom(''); setDateTo('') }}>Clear filters</button>}</div>
      {loading ? <LoadingRows count={7} columns={6} /> : entries.length === 0 ? <EmptyState title="No stock movements found" description="This ledger query returned no entries. Try broadening the date or location filters." /> : <div className="table-scroll"><table className="data-table ledger-table"><thead><tr><th>Date</th><th>Product</th><th>Movement</th><th>Quantity</th><th>Source</th><th>Destination</th><th>Reference</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{formatDate(entry.created_at)}</td><td><Link className="inventory-product-link" to={`/products/${entry.product_id}`}><strong>{productMap.get(entry.product_id)?.name ?? entry.product_id.slice(0, 8)}</strong><small>{productMap.get(entry.product_id)?.sku ?? 'Product'}</small></Link></td><td><Badge>{entry.movement_type.replaceAll('_', ' ')}</Badge></td><td className={Number(entry.quantity) < 0 ? 'quantity-negative' : 'quantity-positive'}>{Number(entry.quantity) > 0 ? '+' : ''}{formatQuantity(entry.quantity)}</td><td>{locationLabel(entry.source_location_id)}</td><td>{locationLabel(entry.destination_location_id)}</td><td className="mono-cell">{entry.reference_id?.slice(0, 8) ?? '—'}</td></tr>)}</tbody></table></div>}
      {!loading && total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />}
    </Card>
  </div>
}

const reportTypes = [
  { id: 'stock', label: 'Stock report', description: 'On-hand and reserved quantities across locations.' },
  { id: 'movements', label: 'Movement report', description: 'Ledger changes by product, movement type, and date.' },
  { id: 'receipts', label: 'Receipt report', description: 'Incoming operation documents and their statuses.' },
  { id: 'deliveries', label: 'Delivery report', description: 'Outgoing operation documents and their statuses.' },
  { id: 'transfers', label: 'Transfer report', description: 'Internal location-to-location operations.' },
  { id: 'adjustments', label: 'Adjustment report', description: 'Physical counts and recorded differences.' },
] as const

export function ReportsPage() {
  const [report, setReport] = useState<(typeof reportTypes)[number]['id']>('stock')
  const [warehouse, setWarehouse] = useState('')
  const [location, setLocation] = useState('')
  const [product, setProduct] = useState('')
  const [category, setCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    Promise.allSettled([catalogApi.warehouses({ page: 1, page_size: 100 }), catalogApi.locations({ page: 1, page_size: 100 }), catalogApi.products({ page: 1, page_size: 100 }), catalogApi.categories({ page: 1, page_size: 100 })]).then(([w, l, p, c]) => { if (w.status === 'fulfilled') setWarehouses(w.value.items); if (l.status === 'fulfilled') setLocations(l.value.items); if (p.status === 'fulfilled') setProducts(p.value.items); if (c.status === 'fulfilled') setCategories(c.value.items) })
  }, [])
  async function exportReport() {
    setBusy(true)
    try { await download(insightsApi.exportCsv(report, { warehouse_id: warehouse || undefined, location_id: location || undefined, product_id: product || undefined, category_id: category || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined }), `stocksense_${report}_report.csv`); notify('success', 'CSV export downloaded.') }
    catch (error) { notify('error', friendlyError(error)) }
    finally { setBusy(false) }
  }
  const current = reportTypes.find((entry) => entry.id === report)!

  return <div className="page-stack"><PageHeader eyebrow="ANALYSIS" title="Reports" description="Choose a report, apply filters, and export the shared backend report query." />
    <div className="reports-layout"><Card className="report-picker"><div className="eyebrow">REPORT LIBRARY</div>{reportTypes.map((item, index) => <button className={`report-option ${report === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setReport(item.id)}><span className={`report-number report-number-${index % 3}`}>0{index + 1}</span><span><strong>{item.label}</strong><small>{item.description}</small></span>{report === item.id && <ArrowRight size={16} />}</button>)}</Card>
      <Card className="report-config"><div className="section-heading"><div><div className="eyebrow">CONFIGURE</div><h2>{current.label}</h2><p>{current.description}</p></div><span className="report-file-icon"><Download size={18} /></span></div>
        <div className="report-filter-grid"><label className="form-field"><span className="field-label">Warehouse</span><select value={warehouse} onChange={(event) => setWarehouse(event.target.value)}><option value="">All warehouses</option>{warehouses.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="form-field"><span className="field-label">Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{locations.filter((entry) => !warehouse || entry.warehouse_id === warehouse).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="form-field"><span className="field-label">Product</span><select value={product} onChange={(event) => setProduct(event.target.value)}><option value="">All products</option>{products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.sku}</option>)}</select></label><label className="form-field"><span className="field-label">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="form-field"><span className="field-label">From date</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label className="form-field"><span className="field-label">To date</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label></div>
        <div className="report-notice"><span className="report-notice-mark">i</span><p>The live API has no JSON endpoints for <code>GET /api/v1/reports/stock-valuation</code>, <code>GET /api/v1/reports/movement-volume</code>, or <code>GET /api/v1/reports/top-slow-moving</code>. CSV is available only through the report export adapter and may return 503 until the Phase 3 ReportingService provider is attached.</p></div>
        <div className="report-actions"><Button variant="secondary" icon={<SlidersHorizontal size={15} />} onClick={() => { setWarehouse(''); setLocation(''); setProduct(''); setCategory(''); setDateFrom(''); setDateTo('') }}>Clear filters</Button><Button icon={<ArrowDownToLine size={16} />} disabled={busy} onClick={exportReport}>{busy ? 'Preparing…' : 'Export CSV'}</Button></div>
      </Card>
    </div>
  </div>
}