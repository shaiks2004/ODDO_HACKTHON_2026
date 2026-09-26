import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  PackageCheck,
  Search,
  Filter,
  ArrowRightLeft,
  FileCheck,
  Truck,
  Plus,
  ArrowRight,
  Info,
  CheckCircle,
  AlertTriangle,
  History,
  Boxes,
} from 'lucide-react';
import { Product } from '../../types/inventory';

export const StockPage: React.FC = () => {
  const { products, warehouses, locations, transferStock } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Internal Transfer Modal State
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [transferQty, setTransferQty] = useState<number>(10);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWarehouse =
        warehouseFilter === 'All' || p.warehouseName === warehouseFilter;

      const matchesCategory =
        categoryFilter === 'All' || p.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Low Stock' && p.onHand <= p.reorderLevel) ||
        (statusFilter === 'In Stock' && p.onHand > p.reorderLevel);

      return matchesSearch && matchesWarehouse && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, warehouseFilter, categoryFilter, statusFilter]);

  // Aggregate metrics
  const totalStockUnits = products.reduce((acc, p) => acc + p.onHand, 0);
  const totalFreeUnits = products.reduce((acc, p) => acc + p.freeToUse, 0);
  const totalReservedUnits = products.reduce((acc, p) => acc + p.reserved, 0);
  const lowStockCount = products.filter((p) => p.onHand <= p.reorderLevel).length;

  // Available locations for the selected target warehouse
  const availableTargetLocations = useMemo(() => {
    if (!targetWarehouse) return locations;
    return locations.filter((loc) => loc.warehouseName === targetWarehouse);
  }, [locations, targetWarehouse]);

  const handleOpenTransfer = (p: Product) => {
    setTransferProduct(p);
    const otherWh = warehouses.find((w) => w.name !== p.warehouseName) || warehouses[0];
    setTargetWarehouse(otherWh?.name || '');
    const defaultLoc = locations.find((l) => l.warehouseName === otherWh?.name) || locations[0];
    setTargetLocation(defaultLoc?.name || '');
    setTransferQty(Math.min(10, p.onHand));
    setTransferError('');
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProduct) return;
    if (!targetWarehouse || !targetLocation) {
      setTransferError('Please select destination warehouse and rack location.');
      return;
    }
    if (transferQty <= 0) {
      setTransferError('Quantity must be greater than zero.');
      return;
    }
    if (transferQty > transferProduct.onHand) {
      setTransferError(`Cannot transfer more than on-hand stock (${transferProduct.onHand} ${transferProduct.unit}).`);
      return;
    }

    const res = await transferStock(
      transferProduct.id,
      transferProduct.warehouseName,
      transferProduct.locationName,
      targetWarehouse,
      targetLocation,
      Number(transferQty),
      transferNotes
    );

    if (res.success) {
      setTransferProduct(null);
    } else {
      setTransferError(res.message || 'Transfer failed');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Availability"
        subtitle="Physical on-hand inventory, reservations, and free-to-use allocations"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/receipts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Receive Stock</span>
            </Link>
            <Link
              to="/delivery/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>Ship Stock</span>
            </Link>
          </div>
        }
      />

      {/* Aggregate Stock Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="border-r border-slate-100 pr-2 last:border-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Active SKUs</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{products.length}</span>
        </div>
        <div className="border-r border-slate-100 px-2 last:border-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total On Hand</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{totalStockUnits.toLocaleString()}</span>
        </div>
        <div className="border-r border-slate-100 px-2 last:border-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Free to Use</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">{totalFreeUnits.toLocaleString()}</span>
        </div>
        <div className="pl-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Reorder Warnings</span>
          <span className={`text-xl font-bold font-mono tabular-nums ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {lowStockCount}
          </span>
        </div>
      </div>

      {/* Operational Explanatory Notice */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <div className="flex-1 text-[11px] leading-relaxed">
          <span className="font-semibold text-slate-900">Enterprise Balance Rule: </span>
          Stock balances cannot be manually overwritten with arbitrary values. Stock increases strictly via verified{' '}
          <strong>Receipts</strong>, decreases via validated <strong>Deliveries</strong>, and relocates across facilities via{' '}
          <strong>Internal Moves</strong>.
          <span className="font-mono text-slate-700 ml-1 bg-white px-1.5 py-0.2 rounded border border-slate-200">
            Free to Use = On Hand - Reserved
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Facilities</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.name}>
                  {wh.name} ({wh.shortCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Components">Components</option>
              <option value="Finished Goods">Finished Goods</option>
              <option value="Packaging">Packaging</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 outline-none"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock (Healthy)</option>
              <option value="Low Stock">Low Stock (≤ Reorder)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wireframe Matching Stock Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3.5">Product & SKU</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Location / Facility</th>
                <th className="py-2.5 px-3 text-right">Reorder Level</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">On Hand</th>
                <th className="py-2.5 px-3 text-right">Free to Use</th>
                <th className="py-2.5 px-3.5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.onHand <= p.reorderLevel;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isLow && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Low
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {p.sku}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                          {p.category}
                        </span>
                      </td>

                      {/* Facility / Location */}
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800">{p.warehouseName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.locationName}
                        </div>
                      </td>

                      {/* Reorder Level */}
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-right tabular-nums">
                        {p.reorderLevel} {p.unit}
                      </td>

                      {/* Current Stock */}
                      <td className="py-2.5 px-3 font-mono text-slate-700 text-right tabular-nums">
                        {p.currentStock.toLocaleString()} {p.unit}
                      </td>

                      {/* On Hand */}
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-right tabular-nums">
                        {p.onHand.toLocaleString()} {p.unit}
                      </td>

                      {/* Free to Use */}
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 text-right tabular-nums">
                        {p.freeToUse.toLocaleString()} {p.unit}
                        {p.reserved > 0 && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            ({p.reserved.toLocaleString()} reserved)
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTransfer(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                            title="Transfer stock to another location"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                            <span>Move</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary Count */}
        <div className="p-2.5 px-3.5 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Showing {filteredProducts.length} of {products.length} products
          </span>
          <span className="font-mono">
            Total Displayed: {filteredProducts.reduce((sum, p) => sum + p.onHand, 0).toLocaleString()} units
          </span>
        </div>
      </div>

      {/* Internal Move Modal */}
      {transferProduct && (
        <Modal
          isOpen={Boolean(transferProduct)}
          onClose={() => setTransferProduct(null)}
          title={`Internal Stock Move: ${transferProduct.name}`}
          subtitle={`Origin: ${transferProduct.warehouseName} (${transferProduct.locationName})`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteTransfer} className="space-y-4">
            {transferError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
                {transferError}
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Available On Hand:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {transferProduct.onHand} {transferProduct.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Assignment:</span>
                <span className="font-medium text-slate-700">
                  {transferProduct.warehouseName} → {transferProduct.locationName}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Warehouse
              </label>
              <select
                value={targetWarehouse}
                onChange={(e) => {
                  setTargetWarehouse(e.target.value);
                  const firstLoc = locations.find((l) => l.warehouseName === e.target.value);
                  setTargetLocation(firstLoc?.name || '');
                }}
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Sub-Location / Rack
              </label>
              <select
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
              >
                {availableTargetLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name} ({loc.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Move Quantity ({transferProduct.unit})
              </label>
              <input
                type="number"
                min="1"
                max={transferProduct.onHand}
                value={transferQty}
                onChange={(e) => setTransferQty(parseInt(e.target.value, 10) || 1)}
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none tabular-nums"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Total enterprise inventory remains unchanged; balance is debited from origin and credited to destination.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Move Reference / Reason (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Relocating buffer stock to assembly bay"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferProduct(null)}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer shadow-2xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Confirm Internal Move</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
