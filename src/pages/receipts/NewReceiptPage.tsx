import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import {
  FileCheck,
  Plus,
  Trash2,
  ArrowLeft,
  Building,
  Calendar,
  Check,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { UnitOfMeasure, ReceiptItem } from '../../types/inventory';

interface FormProductRow {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: UnitOfMeasure;
}

export const NewReceiptPage: React.FC = () => {
  const { products, warehouses, createReceipt, settings } = useInventory();
  const navigate = useNavigate();

  const [reference, setReference] = useState(`WH/IN/000${Math.floor(10 + Math.random() * 90)}`);
  const [supplier, setSupplier] = useState('');
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
        quantity: 10,
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
          quantity: 10,
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
        quantity: 10,
        unit: defaultProd?.unit || 'pcs',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validateInputs = () => {
    if (!reference.trim()) {
      setError('Receipt reference is required.');
      return false;
    }
    if (!supplier.trim()) {
      setError('Supplier name is required.');
      return false;
    }
    if (rows.length === 0) {
      setError('At least one product line item must be added.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSaveOrValidate = (status: 'Draft' | 'Ready' | 'Done') => {
    if (!validateInputs()) return;

    const parentWh = warehouses.find((w) => w.name === warehouseName) || warehouses[0];

    const items: ReceiptItem[] = rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      sku: r.sku,
      quantity: Number(r.quantity),
      unit: r.unit,
    }));

    createReceipt({
      reference: reference.trim().toUpperCase(),
      supplier: supplier.trim(),
      scheduleDate,
      warehouseId: parentWh?.id || 'wh-1',
      warehouseName,
      status,
      items,
      notes: notes.trim() || undefined,
    });

    navigate('/receipts');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="New Receipt"
        subtitle="Create an incoming stock receipt and register received quantities"
        breadcrumbs={[
          { label: 'Receipts', href: '/receipts' },
          { label: 'New Receipt' },
        ]}
        actions={
          <Link
            to="/receipts"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Receipts</span>
          </Link>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Wireframe Fields: Reference, Supplier, Schedule Date, Warehouse */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              Receipt Identification & Logistics Destination
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Receipt Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="WH/IN/0001"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full text-xs font-mono uppercase px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supplier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vendor A"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
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
                  Destination Warehouse <span className="text-rose-500">*</span>
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
                  Products Table
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Specify items and quantities received from this delivery consignment.
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
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr key={index} className="bg-white">
                      <td className="py-2 px-3">
                        <select
                          value={row.productId}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
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
                          className="w-full text-xs font-mono p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 outline-none"
                        />
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-slate-100 pt-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Receipt Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard shipment verified against delivery slip"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Buttons matching wireframe: Save, Validate, Cancel */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Link
            to="/receipts"
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
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSaveOrValidate('Done')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Validate (Increase Stock)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
