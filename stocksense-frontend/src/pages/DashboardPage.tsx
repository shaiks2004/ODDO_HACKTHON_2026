import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, CircleAlert, PackageCheck, PackageMinus, Warehouse, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { catalogApi, insightsApi } from '../api/services'
import type { DashboardSummary, Location, LowStockAlert, Product, StockLedgerEntry } from '../types'
import { Badge, Button, Card, EmptyState, LoadingRows, PageHeader, Skeleton, friendlyError, notify } from '../components/ui'

function count(value: number | undefined) {
  return new Intl.NumberFormat('en-US').format(value ?? 0)
}

function quantity(value: string | number | undefined) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value ?? 0))
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function KpiCard({ label, value, detail, icon: Icon, tint, to }: { label: string; value: number | undefined; detail: string; icon: typeof Boxes; tint: string; to: string }) {
  return <Link to={to} className="kpi-card surface-card">
    <div className="kpi-top"><span className={`kpi-icon ${tint}`}><Icon size={19} strokeWidth={1.8} /></span><ArrowUpRight className="kpi-open" size={16} /></div>
    <span className="kpi-label">{label}</span><strong className="kpi-value">{count(value)}</strong><span className="kpi-detail">{detail}</span>
  </Link>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      insightsApi.dashboard(),
      insightsApi.alerts(),
      insightsApi.ledger({ page: 1, page_size: 8 }),
      catalogApi.products({ page: 1, page_size: 100 }),
      catalogApi.locations({ page: 1, page_size: 100 }),
    ]).then((results) => {
      if (!active) return
      const [summaryResult, alertsResult, ledgerResult, productsResult, locationsResult] = results
      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value)
      else notify('error', friendlyError(summaryResult.reason))
      if (alertsResult.status === 'fulfilled') setAlerts(alertsResult.value)
      if (ledgerResult.status === 'fulfilled') setLedger(ledgerResult.value.items)
      if (productsResult.status === 'fulfilled') setProducts(productsResult.value.items)
      if (locationsResult.status === 'fulfilled') setLocations(locationsResult.value.items)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const productMap = new Map(products.map((product) => [product.id, product]))
  const locationMap = new Map(locations.map((location) => [location.id, location]))
  const movementData = ledger.slice(0, 7).reverse().map((entry) => ({
    label: productMap.get(entry.product_id)?.sku ?? entry.movement_type.replaceAll('_', ' '),
    amount: Math.abs(Number(entry.quantity)),
    type: entry.movement_type.replaceAll('_', ' '),
  }))
  const lowAlerts = alerts.slice(0, 5)

  return <div className="page-stack dashboard-page">
    <PageHeader eyebrow="OVERVIEW" title="Welcome back" description="A clear view of stock, warehouse activity, and what needs attention." action={<Button icon={<Zap size={16} />} onClick={() => navigate('/receipts')}>New receipt</Button>} />

    <section className="kpi-grid" aria-label="Inventory summary">
      <KpiCard label="Products in stock" value={summary?.total_products_in_stock} detail="Distinct products with stock on hand" icon={Boxes} tint="tint-purple" to="/inventory" />
      <KpiCard label="Low stock" value={summary?.low_stock_count} detail="At or below reorder level" icon={CircleAlert} tint="tint-orange" to="/alerts" />
      <KpiCard label="Out of stock" value={summary?.out_of_stock_count} detail="No on-hand quantity recorded" icon={PackageMinus} tint="tint-coral" to="/alerts" />
      <KpiCard label="Scheduled transfers" value={summary?.scheduled_transfers} detail="Internal movements to process" icon={Warehouse} tint="tint-blue" to="/transfers" />
    </section>

    <section className="operation-strip" aria-label="Pending operations">
      <Link to="/receipts" className="operation-chip"><span className="operation-chip-icon receipt-tone"><PackageCheck size={17} /></span><span><small>Pending receipts</small><strong>{loading ? '—' : count(summary?.pending_receipts.pending)}</strong></span><ArrowRight size={15} /></Link>
      <Link to="/deliveries" className="operation-chip"><span className="operation-chip-icon delivery-tone"><ArrowUpRight size={17} /></span><span><small>Pending deliveries</small><strong>{loading ? '—' : count(summary?.pending_deliveries.pending)}</strong></span><ArrowRight size={15} /></Link>
      <Link to="/receipts?status=WAITING" className="operation-chip"><span className="operation-chip-icon late-tone"><ArrowDownRight size={17} /></span><span><small>Late receipts</small><strong>{loading ? '—' : count(summary?.pending_receipts.late)}</strong></span><ArrowRight size={15} /></Link>
      <Link to="/deliveries?status=WAITING" className="operation-chip"><span className="operation-chip-icon waiting-tone"><CircleAlert size={17} /></span><span><small>Waiting deliveries</small><strong>{loading ? '—' : count(summary?.pending_deliveries.waiting)}</strong></span><ArrowRight size={15} /></Link>
    </section>

    <div className="dashboard-grid">
      <Card className="movement-chart-card">
        <div className="section-heading"><div><div className="eyebrow">MOVEMENT HISTORY</div><h2>Recent stock activity</h2><p>Quantities from the latest ledger entries</p></div><Link className="text-link" to="/movements">Full history <ArrowRight size={14} /></Link></div>
        {loading ? <div className="chart-skeleton"><Skeleton /></div> : movementData.length ? <div className="movement-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={movementData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 5" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#9aa1b1', fontSize: 11 }} dy={9} />
          <Tooltip cursor={{ fill: '#f7f7fb' }} contentStyle={{ border: '1px solid #ececf2', borderRadius: 12, boxShadow: '0 8px 30px rgba(32,35,54,.08)' }} formatter={(value) => [quantity(Number(value)), 'Quantity']} labelFormatter={(_, payload) => payload?.[0]?.payload?.type ?? ''} />
          <Bar dataKey="amount" fill="#a99af0" radius={[6, 6, 2, 2]} maxBarSize={34} />
        </BarChart></ResponsiveContainer></div> : <EmptyState title="No stock movements yet" description="Validated receipts, deliveries, transfers, and adjustments will appear here." />}
      </Card>

      <Card className="attention-card">
        <div className="section-heading"><div><div className="eyebrow eyebrow-warm">REPLENISHMENT</div><h2>Needs attention</h2><p>{loading ? 'Checking stock levels…' : `${count(alerts.length)} product-location alerts`}</p></div><span className="attention-mark"><CircleAlert size={18} /></span></div>
        {loading ? <LoadingRows count={4} columns={3} /> : lowAlerts.length ? <div className="attention-list">{lowAlerts.map((alert) => <Link to={`/products/${alert.product_id}`} className="attention-row" key={`${alert.product_id}-${alert.location_id}`}>
          <div className="product-monogram">{alert.product_name.slice(0, 1)}</div><div className="attention-product"><strong>{alert.product_name}</strong><span>{alert.sku} · {alert.location_code}</span></div><div className="attention-quantity"><strong>{quantity(alert.on_hand)}</strong><span>of {quantity(alert.reorder_level)}</span></div><Badge>{alert.stock_status === 'out_of_stock' ? 'OUT OF STOCK' : 'LOW STOCK'}</Badge>
        </Link>)}</div> : <EmptyState title="Stock is in good shape" description="No products are currently at or below their reorder level." />}
        <Link className="attention-footer" to="/alerts">Review all alerts <ArrowRight size={15} /></Link>
      </Card>

      <Card className="recent-table-card">
        <div className="section-heading"><div><div className="eyebrow">AUDIT TRAIL</div><h2>Latest movements</h2><p>Recent changes recorded in the stock ledger</p></div><Link className="text-link" to="/movements">View all <ArrowRight size={14} /></Link></div>
        {loading ? <LoadingRows count={4} columns={4} /> : ledger.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Movement</th><th>Product</th><th>Location</th><th>Quantity</th><th>Date</th></tr></thead><tbody>{ledger.slice(0, 6).map((entry) => {
          const destination = entry.destination_location_id ? locationMap.get(entry.destination_location_id)?.name : null
          const source = entry.source_location_id ? locationMap.get(entry.source_location_id)?.name : null
          return <tr key={entry.id}><td><Badge>{entry.movement_type.replaceAll('_', ' ')}</Badge></td><td><div className="table-primary">{productMap.get(entry.product_id)?.name ?? entry.product_id.slice(0, 8)}</div><div className="table-secondary">{productMap.get(entry.product_id)?.sku ?? 'Product'}</div></td><td>{source && destination ? <span>{source} <ArrowRight size={12} /> {destination}</span> : destination ?? source ?? '—'}</td><td className={Number(entry.quantity) < 0 ? 'quantity-negative' : 'quantity-positive'}>{Number(entry.quantity) > 0 ? '+' : ''}{quantity(entry.quantity)}</td><td>{shortDate(entry.created_at)}</td></tr>
        })}</tbody></table></div> : <EmptyState title="No movements to show" description="The ledger will fill as stock operations are validated." />}
      </Card>
    </div>
  </div>
}