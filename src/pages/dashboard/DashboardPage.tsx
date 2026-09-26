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

  const totalStockUnits = products.reduce((acc, p) => acc + p.onHand, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inventory Operations Dashboard"
        subtitle="Central navigation and operational entry points for warehouse inventory"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/receipts/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>New Receipt</span>
            </Link>
            <Link
              to="/delivery/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>New Delivery</span>
            </Link>
          </div>
        }
      />

      {/* Primary Operational Cards (Wireframe Core Focus: Receipts & Delivery) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipts Operational Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Receipts</h2>
                  <p className="text-xs text-slate-500">Inbound stock from vendors & suppliers</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                INBOUND
              </span>
            </div>

            <div className="my-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {pendingReceipts.length}
              </span>
              <span className="text-sm font-medium text-slate-600 ml-2">
                pending receipts
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Awaiting receiving verification, count confirmation, and stock put-away.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              to="/receipts"
              className="text-xs font-semibold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
            >
              <span>View all receipts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/receipts/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Process Receipt</span>
            </Link>
          </div>
        </div>

        {/* Delivery Operational Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Delivery</h2>
                  <p className="text-xs text-slate-500">Outgoing customer orders & dispatches</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                OUTBOUND
              </span>
            </div>

            <div className="my-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {pendingDeliveries.length}
              </span>
              <span className="text-sm font-medium text-slate-600 ml-2">
                pending deliveries
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Scheduled customer orders pending pick, pack, and freight dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              to="/delivery"
              className="text-xs font-semibold text-slate-900 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
            >
              <span>View all deliveries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/delivery/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Delivery</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Hub Navigation Cards (Matching Architecture Sections) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Inventory Modules & Hierarchy
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Card */}
          <Link
            to="/stock"
            className="group bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <PackageCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Stock Availability</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Current stock, on hand, and free to use balances
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800">
                {products.length} products
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-1">
                View Stock <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* Warehouse Card */}
          <Link
            to="/warehouse"
            className="group bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <WarehouseIcon className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Warehouses</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Facilities, storage buildings, and short codes
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800">
                {warehouses.length} facilities
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* Location Card */}
          <Link
            to="/location"
            className="group bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Locations</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Racks, bays, and sub-locations within warehouses
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800">
                {locations.length} locations
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-1">
                View Racks <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* Move History Card */}
          <Link
            to="/move-history"
            className="group bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <History className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Move History</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Traceable ledger of all stock ins, outs, and moves
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-800">
                {moveHistory.length} moves logged
              </span>
              <span className="text-slate-500 font-medium group-hover:text-slate-900 flex items-center gap-1">
                View Ledger <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Stock Snapshot & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Stock Snapshot Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stock Availability Snapshot</h3>
              <p className="text-xs text-slate-500">Live on-hand and free to use balances</p>
            </div>
            <Link
              to="/stock"
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              Full stock list <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3 text-right">On Hand</th>
                  <th className="py-2.5 px-3 text-right">Free to Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.slice(0, 4).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <div>{p.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.sku} · {p.warehouseName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 text-right">
                      {p.currentStock.toLocaleString()} {p.unit}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-right">
                      {p.onHand.toLocaleString()} {p.unit}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                      {p.freeToUse.toLocaleString()} {p.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Stock Movements Ledger Feed */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Latest Movements</h3>
              <p className="text-xs text-slate-500">Real-time receipt & dispatch ledger entries</p>
            </div>
            <Link
              to="/move-history"
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              Move history <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {moveHistory.slice(0, 4).map((m) => (
              <div key={m.id} className="p-3 hover:bg-slate-50/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      m.operation === 'Receipt'
                        ? 'bg-emerald-50 text-emerald-700'
                        : m.operation === 'Delivery'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {m.operation === 'Receipt' ? (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    ) : m.operation === 'Delivery' ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {m.reference}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
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
                    className={`font-mono font-bold block ${
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
      </div>
    </div>
  );
};
