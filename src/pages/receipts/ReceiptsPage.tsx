import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileCheck,
  Plus,
  Search,
  CheckCircle,
  Eye,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Receipt } from '../../types/inventory';

export const ReceiptsPage: React.FC = () => {
  const { receipts, validateReceipt, warehouses } = useInventory();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [sortField, setSortField] = useState<'reference' | 'scheduleDate' | 'supplier'>('reference');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredReceipts = useMemo(() => {
    return receipts
      .filter((r) => {
        const matchesSearch =
          searchQuery === '' ||
          r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === 'All' || r.status === statusFilter;

        const matchesWarehouse =
          warehouseFilter === 'All' || r.warehouseName === warehouseFilter;

        return matchesSearch && matchesStatus && matchesWarehouse;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [receipts, searchQuery, statusFilter, warehouseFilter, sortField, sortAsc]);

  const toggleSort = (field: 'reference' | 'scheduleDate' | 'supplier') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipts"
        subtitle="Incoming stock orders from suppliers and manufacturing returns"
        actions={
          <Link
            to="/receipts/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Receipt</span>
          </Link>
        }
      />

      {/* Search, Filter, Sort Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, supplier, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Ready">Ready</option>
              <option value="Waiting">Waiting</option>
              <option value="Draft">Draft</option>
              <option value="Done">Done</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>

          <div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Destination Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.name}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Wireframe Matching Receipt Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => toggleSort('reference')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Reference</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('supplier')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Supplier</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Products</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th
                  onClick={() => toggleSort('scheduleDate')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Schedule Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No receipts found. Create your first receipt to start tracking incoming inventory.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const totalQty = r.items.reduce((acc, i) => acc + i.quantity, 0);
                  const firstUnit = r.items[0]?.unit || 'units';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/receipts/${r.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                        {r.reference}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {r.supplier}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {r.items.map((i) => i.productName).join(', ')}
                        <span className="block text-[10px] text-slate-400">
                          To: {r.warehouseName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                        +{totalQty} {firstUnit}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {r.scheduleDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/receipts/${r.id}`}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="View / Edit Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {r.status !== 'Done' && r.status !== 'Canceled' && (
                            <button
                              onClick={() => validateReceipt(r.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                              title="Validate Receipt: Increases current stock and logs to Move History"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Validate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
