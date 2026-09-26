import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Truck,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Building,
  Edit2,
  XCircle,
  Package,
  Save,
  AlertTriangle,
} from 'lucide-react';

export const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getDeliveryById, validateDelivery, updateDelivery, cancelDelivery, products, warehouses } = useInventory();

  const delivery = getDeliveryById(id || '');

  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer] = useState(delivery?.customer || '');
  const [scheduleDate, setScheduleDate] = useState(delivery?.scheduleDate || '');
  const [warehouseName, setWarehouseName] = useState(delivery?.warehouseName || '');
  const [notes, setNotes] = useState(delivery?.notes || '');
  const [validationError, setValidationError] = useState('');

  if (!delivery) {
    return (
      <div className="py-16 text-center space-y-4">
        <Truck className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Delivery Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested delivery document does not exist.
        </p>
        <Link
          to="/delivery"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deliveries</span>
        </Link>
      </div>
    );
  }

  // Check if any product has insufficient stock
  const hasInsufficientStock = delivery.items.some((item) => {
    const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
    return prod ? item.quantity > prod.onHand : false;
  });

  const handleValidate = () => {
    setValidationError('');
    const res = validateDelivery(delivery.id);
    if (!res.success) {
      setValidationError(res.message || 'Insufficient stock available for this delivery.');
    }
  };

  const handleCancelDelivery = () => {
    cancelDelivery(delivery.id);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDelivery(delivery.id, {
      customer: customer.trim(),
      scheduleDate,
      warehouseName,
      notes: notes.trim(),
    });
    setIsEditing(false);
  };

  const isDoneOrCanceled = delivery.status === 'Done' || delivery.status === 'Canceled';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`Delivery Order ${delivery.reference}`}
        subtitle={`Outbound customer shipment record · Origin: ${delivery.warehouseName}`}
        breadcrumbs={[
          { label: 'Delivery', href: '/delivery' },
          { label: delivery.reference },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/delivery"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Deliveries</span>
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
                  onClick={handleCancelDelivery}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  onClick={handleValidate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Validate (Deduct Stock)</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Validation Error Message Notice */}
      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Validation Not Permitted</span>
            <p className="mt-0.5 font-medium">{validationError}</p>
          </div>
        </div>
      )}

      {/* Main Details Card / Form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Status Bar */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Order Status:
            </span>
            <StatusBadge status={delivery.status} size="md" />
          </div>

          {delivery.status === 'Done' ? (
            <span className="text-xs font-medium text-blue-800 bg-blue-50 px-3 py-1 rounded border border-blue-200">
              ✓ Stock has been deducted and dispatch logged in Move History
            </span>
          ) : hasInsufficientStock ? (
            <span className="text-xs font-medium text-rose-800 bg-rose-50 px-3 py-1 rounded border border-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Insufficient stock available for this delivery
            </span>
          ) : null}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  required
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
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
                  Origin Warehouse
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
                Dispatch Notes
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
                  Delivery Reference
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {delivery.reference}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                  Customer / Recipient
                </span>
                <span className="font-semibold text-slate-900 text-sm">
                  {delivery.customer}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                  Schedule Date
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {delivery.scheduleDate}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                  Fulfillment Warehouse
                </span>
                <span className="font-medium text-slate-800">
                  {delivery.warehouseName}
                </span>
              </div>
            </div>

            {delivery.notes && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Shipping Memo:</span>
                {delivery.notes}
              </div>
            )}

            {/* Products Table (Wireframe Requirement) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                Line Items To Dispatch
              </h3>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4 text-right">Order Quantity</th>
                      <th className="py-2.5 px-4 text-right">Stock On Hand</th>
                      <th className="py-2.5 px-4">Unit</th>
                      <th className="py-2.5 px-4 text-center">Availability Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {delivery.items.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
                      const isShort = prod ? item.quantity > prod.onHand : false;

                      return (
                        <tr key={idx} className="bg-white">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.productName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {item.sku || prod?.sku || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-700 text-right text-sm">
                            -{item.quantity}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 text-right">
                            {prod ? prod.onHand.toLocaleString() : '—'} {item.unit}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isShort ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Insufficient Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ✓ In Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
