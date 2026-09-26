import React from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileCheck,
  Truck,
  PackageCheck,
  Warehouse as WarehouseIcon,
  MapPin,
  History,
  ArrowRight,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  AlertTriangle,
  Boxes,
  Layers,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { receipts, deliveries, products, warehouses, locations, moveHistory } = useInventory();

  // Pending counts
  const pendingReceipts = receipts.filter(
    (r) => r.status !== 'Done' && r.status !== 'Canceled'
  );
  const pendingDeliveries = deliveries.filter(
    (d) => d.status !== 'Done' && d.status !== 'Canceled'
  );

  // Stock totals
  const totalStockUnits = products.reduce((acc, p) => acc + p.onHand, 0);
  const totalFreeUnits = products.reduce((acc, p) => acc + p.freeToUse, 0);
  const totalReservedUnits = products.reduce((acc, p) => acc + p.reserved, 0);
  const lowStockItems = products.filter((p) => p.onHand <= p.reorderLevel);

  // Inbound & outbound unit volumes
  const inboundUnits = pendingReceipts.reduce(
    (sum, r) => sum + r.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const outboundUnits = pendingDeliveries.reduce(
    (sum, d) => sum + d.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Enterprise Page Header */}
      <PageHeader
        title="Inventory Operations Dashboard"
        subtitle="Central navigation, active orders, and multi-facility inventory tracking"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/receipts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>New Receipt</span>
            </Link>
            <Link
              to="/delivery/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>New Delivery</span>
            </Link>
          </div>
        }
      />

      {/* High-Density KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Stock Total */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total On Hand
            </span>
            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {totalStockUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">units</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{products.length} active SKUs</span>
            <span className="text-emerald-700 font-medium font-mono">{totalFreeUnits.toLocaleString()} free</span>
          </div>
        </div>

        {/* Metric 2: Inbound Freight Pipeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Inbound Pipeline
            </span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {pendingReceipts.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">pending receipts</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-mono text-emerald-700 font-semibold">+{inboundUnits.toLocaleString()} units</span>
            <span>Awaiting check-in</span>
          </div>
        </div>

        {/* Metric 3: Outbound Orders Pipeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Outbound Orders
            </span>
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {pendingDeliveries.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">pending deliveries</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-mono text-blue-700 font-semibold">-{outboundUnits.toLocaleString()} units</span>
            <span>Pick / Pack / Ship</span>
          </div>
        </div>

        {/* Metric 4: Stock Health Alerts */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Stock Alerts
            </span>
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {lowStockItems.length}
            </span>
            <span className="text-xs text-amber-800 font-medium">below reorder level</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{products.length - lowStockItems.length} healthy</span>
            <Link to="/stock" className="text-amber-800 font-semibold hover:underline">
              Inspect →
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Operational Workbenches (Wireframe Core Focus: Receipts & Delivery) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inbound Receipts Workbench */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Inbound Receipts</h2>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      INBOUND
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Supplier deliveries and purchase order intake</p>
                </div>
              </div>

              <Link
                to="/receipts/new"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Receive</span>
              </Link>
            </div>

            {/* Inbound Queue Preview */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Active Inbound Queue ({pendingReceipts.length})
              </div>

              {pendingReceipts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                  All inbound shipments received and posted.
                </div>
              ) : (
                pendingReceipts.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 bg-slate-50 border border-slate-100 rounded flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/receipts/${r.id}`}
                          className="font-mono text-xs font-bold text-slate-900 hover:text-emerald-700 hover:underline"
                        >
                          {r.reference}
                        </Link>
                        <StatusBadge status={r.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {r.supplier} · {r.warehouseName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-800 block tabular-nums">
                        {r.items.reduce((s, i) => s + i.quantity, 0)} units
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {r.scheduleDate}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              {pendingReceipts.filter((r) => r.status === 'Ready').length} ready for putaway
            </span>
            <Link
              to="/receipts"
              className="font-semibold text-slate-800 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              <span>View all receipts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Outbound Delivery Workbench */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Outbound Delivery</h2>
                    <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      OUTBOUND
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Customer fulfillment and freight dispatch</p>
                </div>
              </div>

              <Link
                to="/delivery/new"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
              </Link>
            </div>

            {/* Outbound Queue Preview */}
            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Scheduled Outbound Queue ({pendingDeliveries.length})
              </div>

              {pendingDeliveries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                  No pending customer delivery orders.
                </div>
              ) : (
                pendingDeliveries.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 bg-slate-50 border border-slate-100 rounded flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/delivery/${d.id}`}
                          className="font-mono text-xs font-bold text-slate-900 hover:text-blue-700 hover:underline"
                        >
                          {d.reference}
                        </Link>
                        <StatusBadge status={d.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {d.customer} · {d.warehouseName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-800 block tabular-nums">
                        {d.items.reduce((s, i) => s + i.quantity, 0)} units
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {d.scheduleDate}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              {pendingDeliveries.filter((d) => d.status === 'Ready').length} ready for freight carrier
            </span>
            <Link
              to="/delivery"
              className="font-semibold text-slate-800 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>View all deliveries</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Modules & Facility Hierarchy Navigation */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Inventory Architecture & Facilities
          </h3>
          <span className="text-xs text-slate-400">3 Warehouses · {locations.length} Sub-locations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stock Availability */}
          <Link
            to="/stock"
            className="group bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700 mb-2 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <PackageCheck className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Stock Availability</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Current stock, on-hand, and free-to-use balances
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {products.length} SKUs
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-0.5 text-[11px]">
                Inspect <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* Warehouses */}
          <Link
            to="/warehouse"
            className="group bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700 mb-2 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <WarehouseIcon className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Warehouses</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Facilities, storage buildings, and codes
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {warehouses.length} facilities
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-0.5 text-[11px]">
                Manage <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* Locations */}
          <Link
            to="/location"
            className="group bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700 mb-2 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Locations</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Racks, bays, and sub-locations per facility
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {locations.length} racks/bays
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-0.5 text-[11px]">
                View <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* Move History */}
          <Link
            to="/move-history"
            className="group bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700 mb-2 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <History className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Move History</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Full audit ledger of all receipts, moves, & dispatches
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {moveHistory.length} moves logged
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-0.5 text-[11px]">
                Audit <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Stock Snapshot & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Live Stock Snapshot Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Stock Availability Snapshot</h3>
                <p className="text-[11px] text-slate-500">Live on-hand and free-to-use balances</p>
              </div>
              <Link
                to="/stock"
                className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1"
              >
                All items <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-right">Current</th>
                    <th className="py-2.5 px-3 text-right">On Hand</th>
                    <th className="py-2.5 px-3 text-right">Free to Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.slice(0, 5).map((p) => {
                    const isLow = p.onHand <= p.reorderLevel;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isLow && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Low stock" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {p.sku} · {p.warehouseName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 text-right tabular-nums">
                          {p.currentStock.toLocaleString()} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-right tabular-nums">
                          {p.onHand.toLocaleString()} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 text-right tabular-nums">
                          {p.freeToUse.toLocaleString()} {p.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50/80 border-t border-slate-200 text-right">
            <Link to="/stock" className="text-[11px] font-semibold text-slate-700 hover:text-slate-900">
              View full stock master ({products.length} products) →
            </Link>
          </div>
        </div>

        {/* Latest Stock Movements Ledger Feed */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Latest Movements</h3>
                <p className="text-[11px] text-slate-500">Real-time receipt, dispatch, and internal transfers</p>
              </div>
              <Link
                to="/move-history"
                className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1"
              >
                Full ledger <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {moveHistory.slice(0, 5).map((m) => (
                <div key={m.id} className="p-2.5 px-3.5 hover:bg-slate-50/70 flex items-center justify-between text-xs transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                        m.operation === 'Receipt'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : m.operation === 'Delivery'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {m.operation === 'Receipt' ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : m.operation === 'Delivery' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowRightLeft className="w-3 h-3" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {m.reference}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {m.operation}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {m.product}: {m.from} → {m.to}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold block tabular-nums ${
                        m.operation === 'Receipt'
                          ? 'text-emerald-700'
                          : m.operation === 'Delivery'
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {m.operation === 'Receipt' ? `+${m.quantity}` : m.operation === 'Delivery' ? `-${m.quantity}` : m.quantity} {m.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50/80 border-t border-slate-200 text-right">
            <Link to="/move-history" className="text-[11px] font-semibold text-slate-700 hover:text-slate-900">
              View complete transaction ledger →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
