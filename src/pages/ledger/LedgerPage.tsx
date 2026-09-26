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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Move Ledger</span>
          </button>
        }
      />

      {/* Multi-attribute Search and Filter Toolbar (Requirements Section 20) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Universal Search by Reference, Product, Operation, Warehouse, Location */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, product, warehouse, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <select
              value={operationFilter}
              onChange={(e) => setOperationFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
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
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Warehouses & Locations</option>
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Operation</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">From</th>
                <th className="py-3.5 px-4">To</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th className="py-3.5 px-4 text-right">Status</th>
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
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {m.reference}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {m.date}
                    </td>
                    <td className="py-3.5 px-4">
                      {getOperationIcon(m.operation)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {m.product}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[160px] truncate">
                      {m.from}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[160px] truncate">
                      {m.to}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-right text-sm">
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
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
