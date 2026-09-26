import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { Search, PackageCheck, FileCheck, Truck, Warehouse as WarehouseIcon, MapPin, X, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products, receipts, deliveries, warehouses, locations } = useInventory();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { products: [], receipts: [], deliveries: [], warehouses: [], locations: [] };

    const matchingProducts = products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 3);

    const matchingReceipts = receipts
      .filter((r) => r.reference.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q) || r.items.some(i => i.productName.toLowerCase().includes(q)))
      .slice(0, 3);

    const matchingDeliveries = deliveries
      .filter((d) => d.reference.toLowerCase().includes(q) || d.customer.toLowerCase().includes(q) || d.items.some(i => i.productName.toLowerCase().includes(q)))
      .slice(0, 3);

    const matchingWarehouses = warehouses
      .filter((w) => w.name.toLowerCase().includes(q) || w.shortCode.toLowerCase().includes(q) || w.address.toLowerCase().includes(q))
      .slice(0, 2);

    const matchingLocations = locations
      .filter((l) => l.name.toLowerCase().includes(q) || l.shortCode.toLowerCase().includes(q) || l.warehouseName.toLowerCase().includes(q))
      .slice(0, 2);

    return {
      products: matchingProducts,
      receipts: matchingReceipts,
      deliveries: matchingDeliveries,
      warehouses: matchingWarehouses,
      locations: matchingLocations,
    };
  }, [query, products, receipts, deliveries, warehouses, locations]);

  if (!isOpen) return null;

  const totalResults =
    searchResults.products.length +
    searchResults.receipts.length +
    searchResults.deliveries.length +
    searchResults.warehouses.length +
    searchResults.locations.length;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search stock, receipts, deliveries, warehouses, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="ml-2 text-[10px] font-mono font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hidden sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {query.trim() === '' ? (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-400">
                Search references like <span className="font-mono text-slate-600">WH/IN/0001</span>, <span className="font-mono text-slate-600">WH/OUT/0001</span>, or products like <span className="font-mono text-slate-600">Steel Rods</span>
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Products Section */}
              {searchResults.products.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5" /> Stock Products ({searchResults.products.length})
                  </div>
                  <div className="space-y-1">
                    {searchResults.products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect('/stock')}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {p.sku} · {p.category} · {p.warehouseName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                          <span>{p.onHand} {p.unit}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receipts Section */}
              {searchResults.receipts.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" /> Receipts ({searchResults.receipts.length})
                  </div>
                  <div className="space-y-1">
                    {searchResults.receipts.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSelect(`/receipts/${r.id}`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 font-mono">
                            {r.reference}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Supplier: {r.supplier} · {r.warehouseName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{r.status}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliveries Section */}
              {searchResults.deliveries.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Deliveries ({searchResults.deliveries.length})
                  </div>
                  <div className="space-y-1">
                    {searchResults.deliveries.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleSelect(`/delivery/${d.id}`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 font-mono">
                            {d.reference}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Customer: {d.customer} · {d.warehouseName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{d.status}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warehouses Section */}
              {searchResults.warehouses.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                    <WarehouseIcon className="w-3.5 h-3.5" /> Warehouses ({searchResults.warehouses.length})
                  </div>
                  <div className="space-y-1">
                    {searchResults.warehouses.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => handleSelect('/warehouse')}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900">
                            {w.name} ({w.shortCode})
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {w.address}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations Section */}
              {searchResults.locations.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Locations ({searchResults.locations.length})
                  </div>
                  <div className="space-y-1">
                    {searchResults.locations.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => handleSelect('/location')}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900">
                            {loc.name} ({loc.shortCode})
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Warehouse: {loc.warehouseName}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono font-medium text-slate-700 bg-white border border-slate-200 px-1 py-0.5 rounded">↑</kbd> <kbd className="font-mono font-medium text-slate-700 bg-white border border-slate-200 px-1 py-0.5 rounded">↓</kbd> to navigate</span>
            <span><kbd className="font-mono font-medium text-slate-700 bg-white border border-slate-200 px-1 py-0.5 rounded">Enter</kbd> to open</span>
          </div>
          <span>StockSense Universal Search</span>
        </div>
      </div>
    </div>
  );
};
