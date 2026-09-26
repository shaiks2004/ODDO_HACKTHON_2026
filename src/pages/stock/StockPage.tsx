import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
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
} from 'lucide-react';
import { Product } from '../../types/inventory';

export const StockPage: React.FC = () => {
  const { products, warehouses, locations, transferStock } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');

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

      return matchesSearch && matchesWarehouse;
    });
  }, [products, searchQuery, warehouseFilter]);

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

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProduct) return;
    if (!targetWarehouse || !targetLocation) {
      setTransferError('Please select destination warehouse and location.');
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

    const res = transferStock(
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
    <div className="space-y-6">
      <PageHeader
        title="Stock Availability"
        subtitle="Current inventory balances, on-hand allocations, and free-to-use availability"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/receipts/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Receive Stock</span>
            </Link>
            <Link
              to="/delivery/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>Ship Stock</span>
            </Link>
          </div>
        }
      />

      {/* Operational Explanatory Notice (Explicit requirement from prompt) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-slate-900">
            How Stock Balances are Maintained in StockSense:
          </p>
          <p className="mt-0.5 leading-relaxed text-slate-600">
            Stock quantities cannot be manually overwritten with arbitrary values. To maintain audit integrity,
            stock increases through <strong>Receipts</strong>, decreases through <strong>Delivery Orders</strong>,
            and relocates across facilities via <strong>Internal Moves</strong>.
            <span className="font-mono text-slate-700 ml-1">
              (Free to Use = On Hand - Reserved)
            </span>
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search stock by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            />
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
                  {wh.name} ({wh.shortCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Wireframe Matching Stock Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Location / Facility</th>
                <th className="py-3.5 px-4 text-right">Current Stock</th>
                <th className="py-3.5 px-4 text-right">On Hand</th>
                <th className="py-3.5 px-4 text-right">Free to Use</th>
                <th className="py-3.5 px-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.sku} · {p.category}
                      </div>
                    </td>

                    {/* Facility / Location */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{p.warehouseName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {p.locationName}
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 text-right text-sm">
                      {p.currentStock.toLocaleString()} {p.unit}
                    </td>

                    {/* On Hand */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right text-sm">
                      {p.onHand.toLocaleString()} {p.unit}
                    </td>

                    {/* Free to Use */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-right text-sm">
                      {p.freeToUse.toLocaleString()} {p.unit}
                      {p.reserved > 0 && (
                        <span className="block text-[10px] font-normal text-slate-400">
                          ({p.reserved.toLocaleString()} reserved)
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenTransfer(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Transfer stock to another location"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                          <span>Move</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Move Modal */}
      {transferProduct && (
        <Modal
          isOpen={Boolean(transferProduct)}
          onClose={() => setTransferProduct(null)}
          title={`Internal Stock Move: ${transferProduct.name}`}
          subtitle={`Current location: ${transferProduct.warehouseName} (${transferProduct.locationName})`}
          maxWidth="md"
        >
          <form onSubmit={handleExecuteTransfer} className="space-y-4">
            {transferError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
                {transferError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Available on hand:</span>
                <span className="font-mono font-bold text-slate-900">
                  {transferProduct.onHand} {transferProduct.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current allocation:</span>
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
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
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
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
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
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Total company stock will remain {transferProduct.onHand} {transferProduct.unit}.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Move Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Relocating buffer stock to assembly cell"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferProduct(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
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
