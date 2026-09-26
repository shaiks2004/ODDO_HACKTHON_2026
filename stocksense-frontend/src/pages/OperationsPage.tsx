import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ChevronDown, CirclePlus, Search, X } from 'lucide-react'
import { catalogApi, inventoryApi, operationsApi } from '../api/services'
import type { Adjustment, Delivery, Location, OperationStatus, Product, Receipt, Transfer, Warehouse } from '../types'
import { Badge, Button, Card, EmptyState, FormField, IconButton, LoadingRows, Modal, PageHeader, friendlyError, notify } from '../components/ui'
import { Pagination } from '../components/Pagination'

type Kind = 'receipts' | 'deliveries' | 'transfers' | 'adjustments'
type Document = Receipt | Delivery | Transfer | Adjustment
type ItemDraft = { product_id: string; quantity: string }
const PAGE_SIZE = 10
const statuses: OperationStatus[] = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']

const config: Record<Kind, { title: string; eyebrow: string; description: string; action: string }> = {
  receipts: { title: 'Receipts', eyebrow: 'INCOMING STOCK', description: 'Track supplier deliveries and bring validated quantities into a location.', action: 'New receipt' },
  deliveries: { title: 'Deliveries', eyebrow: 'OUTGOING STOCK', description: 'Prepare customer orders against available stock before dispatch.', action: 'New delivery' },
  transfers: { title: 'Internal transfers', eyebrow: 'INTERNAL MOVEMENT', description: 'Move stock between warehouse locations with an auditable ledger trail.', action: 'New transfer' },
  adjustments: { title: 'Adjustments', eyebrow: 'PHYSICAL COUNTS', description: 'Reconcile a physical count against the current recorded quantity.', action: 'New adjustment' },
}

function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(value), delay); return () => window.clearTimeout(timer) }, [value, delay])
  return debounced
}

function loadDocuments(kind: Kind, page: number, search: string, status?: OperationStatus) {
  const query = { page, page_size: PAGE_SIZE, search: search || undefined, status }
  if (kind === 'receipts') return operationsApi.receipts(query)
  if (kind === 'deliveries') return operationsApi.deliveries(query)
  if (kind === 'transfers') return operationsApi.transfers(query)
  return operationsApi.adjustments(query)
}

function documentReference(row: Document) { return row.reference }
function documentStatus(row: Document) { return row.status }
function documentItems(row: Document) { return 'items' in row ? row.items : [] }
function quantity(value: string | number | undefined) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value ?? 0)) }
function displayDate(value: string | null) { return value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Not scheduled' }

export function OperationsPage({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const searchTerm = useDebounced(search)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [active, setActive] = useState<Document | null>(null)
  const [busyId, setBusyId] = useState('')
  const [formBusy, setFormBusy] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [form, setForm] = useState({ counterparty: '', source: '', destination: '', scheduled: '', product: '', physical: '', reason: '', items: [{ product_id: '', quantity: '1' }] as ItemDraft[] })
  const [systemQuantity, setSystemQuantity] = useState<string | null>(null)

  const pageInfo = config[kind]
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const locationMap = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations])
  const warehouseMap = useMemo(() => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])), [warehouses])

  useEffect(() => { setPage(1) }, [searchTerm, status])
  useEffect(() => {
    let activeRequest = true
    setLoading(true)
    loadDocuments(kind, page, searchTerm, status ? status as OperationStatus : undefined)
      .then((result) => { if (activeRequest) { setRows(result.items); setTotal(result.total) } })
      .catch((error) => { if (activeRequest) notify('error', friendlyError(error)) })
      .finally(() => { if (activeRequest) setLoading(false) })
    return () => { activeRequest = false }
  }, [kind, page, searchTerm, status])

  useEffect(() => {
    Promise.allSettled([catalogApi.products({ page: 1, page_size: 100 }), catalogApi.locations({ page: 1, page_size: 100 }), catalogApi.warehouses({ page: 1, page_size: 100 })]).then(([p, l, w]) => {
      if (p.status === 'fulfilled') setProducts(p.value.items)
      if (l.status === 'fulfilled') setLocations(l.value.items)
      if (w.status === 'fulfilled') setWarehouses(w.value.items)
    })
  }, [])

  useEffect(() => {
    if (kind !== 'adjustments' || !form.product || !form.source) { setSystemQuantity(null); return }
    let activeRequest = true
    inventoryApi.list({ product_id: form.product, location_id: form.source, page: 1, page_size: 1 })
      .then((result) => { if (activeRequest) setSystemQuantity(result.items[0]?.on_hand ?? '0') })
      .catch(() => { if (activeRequest) setSystemQuantity(null) })
    return () => { activeRequest = false }
  }, [kind, form.product, form.source])

  async function refresh() {
    const result = await loadDocuments(kind, page, searchTerm, status ? status as OperationStatus : undefined)
    setRows(result.items)
    setTotal(result.total)
  }

  function openCreate() {
    setActive(null)
    setForm({ counterparty: '', source: '', destination: '', scheduled: '', product: '', physical: '', reason: '', items: [{ product_id: '', quantity: '1' }] })
    setSystemQuantity(null)
    setModalOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormBusy(true)
    try {
      const scheduled_date = form.scheduled ? new Date(form.scheduled).toISOString() : null
      const items = form.items.filter((item) => item.product_id && item.quantity).map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
      if (kind === 'receipts') await operationsApi.createReceipt({ supplier_name: form.counterparty, destination_location_id: form.destination, scheduled_date, items })
      if (kind === 'deliveries') await operationsApi.createDelivery({ customer_name: form.counterparty, source_location_id: form.source, scheduled_date, items })
      if (kind === 'transfers') await operationsApi.createTransfer({ source_location_id: form.source, destination_location_id: form.destination, scheduled_date, items })
      if (kind === 'adjustments') await operationsApi.createAdjustment({ product_id: form.product, location_id: form.source, physical_quantity: form.physical, reason: form.reason })
      notify('success', `${pageInfo.title.slice(0, -1)} created as a draft.`)
      setModalOpen(false)
      await refresh()
    } catch (error) {
      notify('error', friendlyError(error))
    } finally {
      setFormBusy(false)
    }
  }

  async function runAction(row: Document, action: 'prepare' | 'validate' | 'cancel') {
    const label = action === 'cancel' ? 'Cancel this operation?' : action === 'prepare' ? 'Check availability and prepare this delivery?' : 'Validate and apply this stock movement?'
    if (!window.confirm(label)) return
    setBusyId(row.id)
    try {
      if (kind === 'receipts') {
        if (action === 'validate') await operationsApi.validateReceipt(row.id)
        if (action === 'cancel') await operationsApi.cancelReceipt(row.id)
      } else if (kind === 'deliveries') {
        if (action === 'prepare') await operationsApi.prepareDelivery(row.id)
        if (action === 'validate') await operationsApi.validateDelivery(row.id)
        if (action === 'cancel') await operationsApi.cancelDelivery(row.id)
      } else if (kind === 'transfers') {
        if (action === 'validate') await operationsApi.validateTransfer(row.id)
        if (action === 'cancel') await operationsApi.cancelTransfer(row.id)
      } else if (action === 'validate') await operationsApi.validateAdjustment(row.id)
      notify('success', action === 'cancel' ? 'Operation canceled.' : action === 'prepare' ? 'Delivery availability checked.' : 'Operation validated.')
      await refresh()
      if (active?.id === row.id) setActive(null)
    } catch (error) {
      notify('error', friendlyError(error))
    } finally {
      setBusyId('')
    }
  }

  function lineTotal(row: Document) { return documentItems(row).reduce((sum, item) => sum + Number(item.quantity), 0) }
  function otherParty(row: Document) {
    if ('supplier_name' in row) return row.supplier_name
    if ('customer_name' in row) return row.customer_name
    if ('source_location_id' in row && 'destination_location_id' in row) return `${locationMap.get(row.source_location_id)?.name ?? 'Source'} → ${locationMap.get(row.destination_location_id)?.name ?? 'Destination'}`
    return productMap.get(row.product_id)?.name ?? 'Stock adjustment'
  }

  return <div className="page-stack"><PageHeader eyebrow={pageInfo.eyebrow} title={pageInfo.title} description={pageInfo.description} action={<Button icon={<CirclePlus size={17} />} onClick={openCreate}>{pageInfo.action}</Button>} />
    <Card className="list-card"><div className="list-toolbar"><label className="list-search"><Search size={17} /><input aria-label={`Search ${pageInfo.title}`} placeholder="Search reference or name..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="filter-select"><select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={14} /></label><span className="result-count">{loading ? 'Updating…' : `${total} records`}</span></div>
      {loading ? <LoadingRows count={7} columns={5} /> : rows.length === 0 ? <EmptyState title={`No ${pageInfo.title.toLowerCase()} found`} description={search || status ? 'Try another search or status filter.' : `Create a ${kind.slice(0, -1)} to start tracking this workflow.`} action={!search && !status ? <Button size="sm" icon={<CirclePlus size={15} />} onClick={openCreate}>{pageInfo.action}</Button> : undefined} /> : <div className="table-scroll"><table className="data-table operation-table"><thead><tr><th>Reference</th><th>{kind === 'receipts' ? 'Supplier' : kind === 'deliveries' ? 'Customer' : kind === 'transfers' ? 'Route' : 'Product'}</th><th>{kind === 'adjustments' ? 'Difference' : 'Items / quantity'}</th><th>Scheduled</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>
        <td><button className="reference-button" onClick={() => setActive(row)}><strong>{documentReference(row)}</strong><small>Created {displayDate(row.created_at)}</small></button></td>
        <td><span className="counterparty-cell">{otherParty(row)}</span></td>
        <td>{'physical_quantity' in row ? <span className={Number(row.difference) < 0 ? 'quantity-negative' : 'quantity-positive'}>{Number(row.difference) > 0 ? '+' : ''}{quantity(row.difference)}</span> : <><strong>{documentItems(row).length} items</strong><small className="table-secondary">{quantity(lineTotal(row))} total units</small></>}</td>
        <td>{displayDate('scheduled_date' in row ? row.scheduled_date : null)}</td><td><Badge>{documentStatus(row)}</Badge></td>
        <td><div className="row-actions">{kind === 'deliveries' && row.status !== 'DONE' && row.status !== 'CANCELED' && <Button size="sm" variant="secondary" disabled={busyId === row.id} onClick={() => runAction(row, 'prepare')}>Prepare</Button>}{row.status !== 'DONE' && row.status !== 'CANCELED' && <Button size="sm" disabled={busyId === row.id || (row.status === 'WAITING' && kind === 'deliveries')} onClick={() => runAction(row, 'validate')}>{busyId === row.id ? 'Working…' : 'Validate'}</Button>}{kind !== 'adjustments' && row.status !== 'DONE' && row.status !== 'CANCELED' && <IconButton label={`Cancel ${row.reference}`} className="danger-icon" onClick={() => runAction(row, 'cancel')}><X size={16} /></IconButton>}</div></td>
      </tr>)}</tbody></table></div>}
      {!loading && total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />}
    </Card>

    {modalOpen && <Modal title={`Create ${kind.slice(0, -1)}`} subtitle="New operation documents start in draft. Stock only changes after backend validation." onClose={() => setModalOpen(false)} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" form="operation-form" disabled={formBusy}>{formBusy ? 'Saving…' : 'Create draft'}</Button></>}>
      <form id="operation-form" className="form-grid" onSubmit={submit}>
        {(kind === 'receipts' || kind === 'deliveries') && <FormField label={kind === 'receipts' ? 'Supplier' : 'Customer'}><input required maxLength={200} value={form.counterparty} onChange={(event) => setForm({ ...form, counterparty: event.target.value })} placeholder={kind === 'receipts' ? 'Supplier name' : 'Customer name'} /></FormField>}
        {kind === 'receipts' && <FormField label="Destination location"><select required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })}><option value="">Select location</option>{locations.map((location) => <option value={location.id} key={location.id}>{warehouseMap.get(location.warehouse_id)?.name ?? ''} · {location.name}</option>)}</select></FormField>}
        {(kind === 'deliveries' || kind === 'transfers' || kind === 'adjustments') && <FormField label={kind === 'deliveries' || kind === 'transfers' ? 'Source location' : 'Location'}><select required value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}><option value="">Select location</option>{locations.map((location) => <option value={location.id} key={location.id}>{warehouseMap.get(location.warehouse_id)?.name ?? ''} · {location.name}</option>)}</select></FormField>}
        {kind === 'transfers' && <FormField label="Destination location"><select required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })}><option value="">Select location</option>{locations.filter((location) => location.id !== form.source).map((location) => <option value={location.id} key={location.id}>{warehouseMap.get(location.warehouse_id)?.name ?? ''} · {location.name}</option>)}</select></FormField>}
        {(kind === 'receipts' || kind === 'deliveries' || kind === 'transfers') && <FormField label="Scheduled date" hint="Optional"><input type="datetime-local" value={form.scheduled} onChange={(event) => setForm({ ...form, scheduled: event.target.value })} /></FormField>}
        {kind === 'adjustments' && <>
          <FormField label="Product"><select required value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></FormField>
          <FormField label="System quantity" hint="Read-only snapshot. The backend verifies it has not changed at validation time."><input readOnly value={systemQuantity ?? (form.product && form.source ? 'Loading…' : 'Select product and location')} /></FormField>
          <FormField label="Physical quantity"><input type="number" min="0" step="0.001" required value={form.physical} onChange={(event) => setForm({ ...form, physical: event.target.value })} /></FormField>
          <FormField label="Reason"><textarea required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={3} placeholder="Describe the count discrepancy" /></FormField>
        </>}
        {(kind === 'receipts' || kind === 'deliveries' || kind === 'transfers') && <div className="form-lines"><div className="form-lines-heading"><div><strong>Products</strong><small>Add each product and requested quantity.</small></div><Button size="sm" variant="secondary" icon={<CirclePlus size={14} />} onClick={() => setForm({ ...form, items: [...form.items, { product_id: '', quantity: '1' }] })}>Add item</Button></div>
          {form.items.map((item, index) => <div className="item-editor-row" key={index}><label className="item-product-select"><span className="sr-only">Product</span><select required value={item.product_id} onChange={(event) => setForm({ ...form, items: form.items.map((entry, i) => i === index ? { ...entry, product_id: event.target.value } : entry) })}><option value="">Select product</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name} · {product.sku}</option>)}</select></label><label className="item-quantity-input"><span className="sr-only">Quantity</span><input type="number" min="0.001" step="0.001" required value={item.quantity} onChange={(event) => setForm({ ...form, items: form.items.map((entry, i) => i === index ? { ...entry, quantity: event.target.value } : entry) })} /></label>{form.items.length > 1 && <IconButton label="Remove item" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}><X size={15} /></IconButton>}</div>)}
        </div>}
      </form>
    </Modal>}
    {active && <Modal title={documentReference(active)} subtitle={`${pageInfo.title.slice(0, -1)} details`} onClose={() => setActive(null)} footer={<><Button variant="secondary" onClick={() => setActive(null)}>Close</Button>{active.status !== 'DONE' && active.status !== 'CANCELED' && <Button disabled={busyId === active.id} onClick={() => runAction(active, 'validate')}>Validate operation</Button>}</>}>
      <div className="document-detail"><div className="detail-inline-status"><span>Status</span><Badge>{active.status}</Badge></div><div className="detail-inline-status"><span>Created</span><strong>{displayDate(active.created_at)}</strong></div>{'scheduled_date' in active && <div className="detail-inline-status"><span>Scheduled date</span><strong>{displayDate(active.scheduled_date)}</strong></div>}{'reason' in active && <div className="detail-inline-status"><span>Reason</span><strong>{active.reason}</strong></div>}
        {'items' in active && <div className="document-items"><strong>Items</strong>{active.items.map((item) => <div className="document-item-row" key={item.id}><span>{productMap.get(item.product_id)?.name ?? item.product_id.slice(0, 8)}<small>{productMap.get(item.product_id)?.sku ?? 'Product'}</small></span><strong>{quantity(item.quantity)}</strong></div>)}</div>}
      </div>
    </Modal>}
  </div>
}