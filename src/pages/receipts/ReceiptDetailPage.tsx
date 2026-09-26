import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileCheck,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Building,
  Edit2,
  XCircle,
  Package,
  Save,
} from 'lucide-react';

export const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getReceiptById, validateReceipt, updateReceipt, cancelReceipt, warehouses } = useInventory();
  const navigate = useNavigate();

  const receipt = getReceiptById(id || '');

  const [isEditing, setIsEditing] = useState(false);
  const [supplier, setSupplier] = useState(receipt?.supplier || '');
  const [scheduleDate, setScheduleDate] = useState(receipt?.scheduleDate || '');
  const [warehouseName, setWarehouseName] = useState(receipt?.warehouseName || '');
  const [notes, setNotes] = useState(receipt?.notes || '');

  if (!receipt) {
    return (
      <div className="py-16 text-center space-y-4">
        <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Receipt Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested receipt document does not exist.
        </p>
        <Link
          to="/receipts"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Receipts</span>
        </Link>
      </div>
    );
  }

  const handleValidate = () => {
    const res = validateReceipt(receipt.id);
    if (res.success) {
      // Stay on page to see status changed to Done
    }
  };

  const handleCancelReceipt = () => {
    cancelReceipt(receipt.id);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateReceipt(receipt.id, {
      supplier: supplier.trim(),
      scheduleDate,
      warehouseName,
      notes: notes.trim(),
    });
    setIsEditing(false);
  };

  const isDoneOrCanceled = receipt.status === 'Done' || receipt.status === 'Canceled';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Receipt ${receipt.reference}`}
        subtitle={`Inbound supplier shipment record · Destination: ${receipt.warehouseName}`}
        breadcrumbs={[
          { label: 'Receipts', href: '/receipts' },
          { label: receipt.reference },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/receipts"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Receipts</span>
            </Link>

            {!isDoneOrCanceled && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={handleCancelReceipt}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  onClick={handleValidate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Validate (Increase Stock)</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Main Details Card / Form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Status bar */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Document Status:
            </span>
            <StatusBadge status={receipt.status} size="md" />
          </div>

          {receipt.status === 'Done' && (
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
              ✓ Stock has been successfully posted to physical inventory
            </span>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Date
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Warehouse
                </label>
                <select
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.name}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel Edit
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Updates</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                  Receipt Reference
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {receipt.reference}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                  Supplier / Vendor
                </span>
                <span className="font-semibold text-slate-900 text-sm">
                  {receipt.supplier}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                  Schedule Date
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {receipt.scheduleDate}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                  Warehouse Location
                </span>
                <span className="font-medium text-slate-800">
                  {receipt.warehouseName}
                </span>
              </div>
            </div>

            {receipt.notes && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Shipment Notes:</span>
                {receipt.notes}
              </div>
            )}

            {/* Products Table (Wireframe Requirement) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                Line Items Received
              </h3>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {item.sku || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right text-sm">
                          +{item.quantity}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
