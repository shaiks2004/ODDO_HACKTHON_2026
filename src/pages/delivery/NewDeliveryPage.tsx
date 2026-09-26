import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Truck,
  Plus,
  Trash2,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { UnitOfMeasure, DeliveryItem } from '../../types/inventory';

interface FormProductRow {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: UnitOfMeasure;
}

export const NewDeliveryPage: React.FC = () => {
  const { products, warehouses, createDelivery, settings } = useInventory();
  const navigate = useNavigate();

  const [reference, setReference] = useState(`WH/OUT/000${Math.floor(10 + Math.random() * 90)}`);
  const [customer, setCustomer] = useState('');
  const [scheduleDate, setScheduleDate] = useState(
    new Date().toLocaleDateString('en-GB')
  );
  const [warehouseName, setWarehouseName] = useState(
    settings.defaultWarehouse || warehouses[0]?.name || 'Main Warehouse'
  );
  const [notes, setNotes] = useState('');

  // Initial product row initialized dynamically from product catalog
  const [rows, setRows] = useState<FormProductRow[]>(() => {
    const defaultProd = products[0];
    return [
      {
        productId: defaultProd?.id || '',
        productName: defaultProd?.name || '',
        sku: defaultProd?.sku || '',
        quantity: 5,
        unit: defaultProd?.unit || 'pcs',
      },
    ];
  });

  // Ensure first row is populated once products are loaded
  React.useEffect(() => {
    if (products.length > 0 && rows.length === 1 && !rows[0].productId) {
      setRows([
        {
          productId: products[0].id,
          productName: products[0].name,
          sku: products[0].sku,
          quantity: 5,
          unit: products[0].unit,
        },
      ]);
    }
  }, [products]);

  const [error, setError] = useState('');

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: Math.max(1, qty),
      };
      return updated;
    });
  };

  const handleAddRow = () => {
    const defaultProd = products[0];
    setRows((prev) => [
      ...prev,
      {
        productId: defaultProd?.id || '',
        productName: defaultProd?.name || '',
        sku: defaultProd?.sku || '',
        quantity: 5,
        unit: defaultProd?.unit || 'pcs',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Check if any product exceeds available stock
  const stockExceededRows = rows.filter((r) => {
    const prod = products.find((p) => p.id === r.productId);
    return prod ? r.quantity > prod.onHand : false;
  });

  const validateInputs = (isDirectValidation: boolean) => {
    if (!reference.trim()) {
      setError('Delivery reference is required.');
      return false;
    }
    if (!customer.trim()) {
      setError('Customer name is required.');
      return false;
    }
    if (rows.length === 0) {
      setError('At least one product line item must be added.');
      return false;
    }

    // Critical Requirement: If requested quantity > available stock, DO NOT ALLOW VALIDATION
    if (isDirectValidation && stockExceededRows.length > 0) {
      const firstFaulty = stockExceededRows[0];
      const prod = products.find((p) => p.id === firstFaulty.productId);
      setError(`Insufficient stock available for this delivery. ${firstFaulty.productName} requires ${firstFaulty.quantity} ${firstFaulty.unit}, but only ${prod?.onHand || 0} ${firstFaulty.unit} is on hand.`);
      return false;
    }

    setError('');
    return true;
  };

  const handleSaveOrValidate = (status: 'Draft' | 'Ready' | 'Done') => {
    const isDirectValidation = status === 'Done';
    if (!validateInputs(isDirectValidation)) return;

    const parentWh = warehouses.find((w) => w.name === warehouseName) || warehouses[0];

    const items: DeliveryItem[] = rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      sku: r.sku,
      quantity: Number(r.quantity),
      unit: r.unit,
    }));

    createDelivery({
      reference: reference.trim().toUpperCase(),
      customer: customer.trim(),
      scheduleDate,
      warehouseId: parentWh?.id || 'wh-1',
      warehouseName,
      status,
      items,
      notes: notes.trim() || undefined,
    });

    navigate('/delivery');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="New Delivery Order"
        subtitle="Schedule customer shipment and verify outbound inventory stock"
        breadcrumbs={[
          { label: 'Delivery', href: '/delivery' },
          { label: 'New Delivery' },
        ]}
        actions={
          <Link
            to="/delivery"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Deliveries</span>
          </Link>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">Validation Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Wireframe Fields: Reference, Customer, Schedule Date, Warehouse */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              Order Header & Origin Facility
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Delivery Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="WH/OUT/0001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full text-xs font-mono uppercase px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer / Recipient <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer A"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Schedule Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fulfillment Warehouse <span className="text-rose-500">*</span>
                </label>
                <select
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.name}>
                      {wh.name} ({wh.shortCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Wireframe Products Table: Product, Quantity, Unit, + Add Product */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Products To Dispatch
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Review available stock on hand before dispatching customer items.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Product</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 w-36">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Available On Hand</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => {
                    const prod = products.find((p) => p.id === row.productId);
                    const isExceeded = prod ? row.quantity > prod.onHand : false;

                    return (
                      <tr key={index} className={isExceeded ? 'bg-rose-50/40' : 'bg-white'}>
                        <td className="py-2 px-3">
                          <select
                            value={row.productId}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) — {p.onHand} {p.unit} on hand
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {row.sku}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) =>
                              handleQuantityChange(index, parseInt(e.target.value, 10) || 1)
                            }
                            className={`w-full text-xs font-mono p-1.5 border rounded focus:ring-1 outline-none ${
                              isExceeded ? 'border-rose-400 bg-rose-50/60 text-rose-900 font-bold' : 'border-slate-300'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-right">
                          <span className={isExceeded ? 'text-rose-700' : 'text-slate-800'}>
                            {prod ? prod.onHand.toLocaleString() : '—'} {row.unit}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {row.unit}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            disabled={rows.length <= 1}
                            onClick={() => handleRemoveRow(index)}
                            className={`p-1 rounded text-slate-400 hover:text-rose-600 ${
                              rows.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-rose-50'
                            }`}
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {stockExceededRows.length > 0 && (
              <div className="mt-2 text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>
                  Insufficient stock available for this delivery. Reduce quantity before validating.
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="border-t border-slate-100 pt-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Delivery Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scheduled customer freight dispatch"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Buttons matching wireframe: Save, Validate, Cancel */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Link
            to="/delivery"
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:underline"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSaveOrValidate('Ready')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrValidate('Done')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                stockExceededRows.length > 0
                  ? 'bg-slate-400 cursor-not-allowed opacity-75'
                  : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Validate (Deduct Stock)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
