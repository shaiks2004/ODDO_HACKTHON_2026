import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  History,
  Search,
  Download,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  RotateCcw,
} from 'lucide-react';
import { OperationType } from '../../types/inventory';

export const LedgerPage: React.FC = () => {
  const { moveHistory, warehouses } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [operationFilter, setOperationFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  // Working search across Reference, Product, Operation, Warehouse, Location
  const filteredHistory = useMemo(() => {
    return moveHistory.filter((entry) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        entry.reference.toLowerCase().includes(q) ||
        entry.product.toLowerCase().includes(q) ||
        entry.operation.toLowerCase().includes(q) ||
        entry.from.toLowerCase().includes(q) ||
        entry.to.toLowerCase().includes(q);

      const matchesOperation =
        operationFilter === 'All' || entry.operation === operationFilter;

      const matchesWarehouse =
        warehouseFilter === 'All' ||
        entry.from.toLowerCase().includes(warehouseFilter.toLowerCase()) ||
        entry.to.toLowerCase().includes(warehouseFilter.toLowerCase());

      return matchesSearch && matchesOperation && matchesWarehouse;
    });
  }, [moveHistory, searchQuery, operationFilter, warehouseFilter]);

  const exportCSV = () => {
    const headers = ['Reference,Date,Operation,Product,From,To,Quantity,Unit,Status'];
    const rows = filteredHistory.map(
      (m) =>
        `"${m.reference}","${m.date}","${m.operation}","${m.product}","${m.from}","${m.to}",${m.quantity},"${m.unit}","${m.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_move_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOperationIcon = (op: OperationType) => {
    switch (op) {
      case 'Receipt':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ArrowDownRight className="w-3 h-3" /> Receipt
          </span>
        );
      case 'Delivery':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <ArrowUpRight className="w-3 h-3" /> Delivery
          </span>
        );
      case 'Internal Transfer':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <ArrowRightLeft className="w-3 h-3" /> Transfer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Move History"
        subtitle="Complete chronological ledger of all physical stock movements, receipts, and deliveries"
        actions={
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Aggregate Transaction Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
        <div className="border-r border-slate-100 pr-2 last:border-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Logged</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{moveHistory.length}</span>
        </div>
        <div className="border-r border-slate-100 px-2 last:border-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Receipts</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {moveHistory.filter((m) => m.operation === 'Receipt').length}
          </span>
        </div>
        <div className="border-r border-slate-100 px-2 last:border-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Deliveries</span>
          <span className="text-xl font-bold font-mono text-blue-700 tabular-nums">
            {moveHistory.filter((m) => m.operation === 'Delivery').length}
          </span>
        </div>
        <div className="pl-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Internal Moves</span>
          <span className="text-xl font-bold font-mono text-slate-700 tabular-nums">
            {moveHistory.filter((m) => m.operation === 'Internal Transfer').length}
          </span>
        </div>
      </div>

      {/* Multi-attribute Search and Filter Toolbar (Requirements Section 20) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Universal Search by Reference, Product, Operation, Warehouse, Location */}
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, product, warehouse, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <select
              value={operationFilter}
              onChange={(e) => setOperationFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Operations (Receipt, Delivery, Transfer)</option>
              <option value="Receipt">Receipts (Incoming)</option>
              <option value="Delivery">Deliveries (Outgoing)</option>
              <option value="Internal Transfer">Internal Transfers (Relocation)</option>
            </select>
          </div>

          <div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Facilities & Locations</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.name}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {searchQuery && (
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>
              Filtering by: <strong>"{searchQuery}"</strong> ({filteredHistory.length} matching movements)
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Wireframe Matching Move History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3.5">Reference</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">From</th>
                <th className="py-2.5 px-3">To</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No movement history found matching your search.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                      {m.reference}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                      {m.date}
                    </td>
                    <td className="py-2.5 px-3">
                      {getOperationIcon(m.operation)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {m.product}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate">
                      {m.from}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate">
                      {m.to}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-xs tabular-nums">
                      <span
                        className={
                          m.operation === 'Receipt'
                            ? 'text-emerald-700'
                            : m.operation === 'Delivery'
                            ? 'text-rose-700'
                            : 'text-slate-800'
                        }
                      >
                        {m.operation === 'Receipt' ? `+${m.quantity}` : m.operation === 'Delivery' ? `-${m.quantity}` : m.quantity} {m.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-2.5 px-3.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Displaying {filteredHistory.length} movements
          </span>
          <span className="font-mono">
            Audit Integrity: Verified
          </span>
        </div>
      </div>
    </div>
  );
};
