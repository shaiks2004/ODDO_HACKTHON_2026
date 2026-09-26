import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  MapPin,
  User,
  Phone,
  Edit2,
  Trash2,
  Eye,
  Check,
  Building,
} from 'lucide-react';
import { Warehouse } from '../../types/inventory';

export const WarehousePage: React.FC = () => {
  const { warehouses, locations, products, addWarehouse, updateWarehouse, deleteWarehouse } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formShortCode, setFormShortCode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState('');

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      return (
        searchQuery === '' ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [warehouses, searchQuery]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormShortCode('');
    setFormAddress('');
    setFormManager('Marcus Vance');
    setFormPhone('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setFormName(w.name);
    setFormShortCode(w.shortCode);
    setFormAddress(w.address);
    setFormManager(w.manager || '');
    setFormPhone(w.phone || '');
    setFormError('');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formShortCode.trim()) {
      setFormError('Warehouse name and short code are required.');
      return;
    }

    addWarehouse({
      name: formName.trim(),
      shortCode: formShortCode.trim().toUpperCase(),
      address: formAddress.trim() || 'Logistics Sector Bay',
      manager: formManager.trim() || undefined,
      phone: formPhone.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;
    if (!formName.trim() || !formShortCode.trim()) {
      setFormError('Warehouse name and short code are required.');
      return;
    }

    updateWarehouse(editingWarehouse.id, {
      name: formName.trim(),
      shortCode: formShortCode.trim().toUpperCase(),
      address: formAddress.trim(),
      manager: formManager.trim(),
      phone: formPhone.trim(),
    });

    setEditingWarehouse(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteWarehouse(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Facilities"
        subtitle="Manage primary storage facilities and distribution center hubs"
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Warehouse</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search warehouse by name, code, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Wireframe Matching Warehouse Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Short Code</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Facility Manager</th>
                <th className="py-3.5 px-4 text-center">Sub-Locations</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No warehouses found.
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((wh) => {
                  const whLocations = locations.filter((l) => l.warehouseId === wh.id || l.warehouseName === wh.name);
                  return (
                    <tr key={wh.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {wh.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {wh.shortCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {wh.address}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {wh.manager || 'Operations Lead'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {whLocations.length} racks/bays
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingWarehouse(wh)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="View Warehouse Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(wh)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="Edit Warehouse"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(wh.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Delete Warehouse"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Warehouse"
        subtitle="Create a new physical storage warehouse in the system"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Warehouse Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Main Warehouse"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MW-01"
                value={formShortCode}
                onChange={(e) => setFormShortCode(e.target.value)}
                className="w-full text-xs font-mono uppercase p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manager Contact
              </label>
              <input
                type="text"
                placeholder="e.g. Marcus Vance"
                value={formManager}
                onChange={(e) => setFormManager(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Address
            </label>
            <input
              type="text"
              placeholder="e.g. Industrial Area, Sector 9"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Warehouse</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Warehouse Modal */}
      {editingWarehouse && (
        <Modal
          isOpen={Boolean(editingWarehouse)}
          onClose={() => setEditingWarehouse(null)}
          title={`Edit Warehouse: ${editingWarehouse.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warehouse Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formShortCode}
                  onChange={(e) => setFormShortCode(e.target.value)}
                  className="w-full text-xs font-mono uppercase p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager
                </label>
                <input
                  type="text"
                  value={formManager}
                  onChange={(e) => setFormManager(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingWarehouse(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Warehouse Details Modal */}
      {viewingWarehouse && (
        <Modal
          isOpen={Boolean(viewingWarehouse)}
          onClose={() => setViewingWarehouse(null)}
          title={`Warehouse: ${viewingWarehouse.name} (${viewingWarehouse.shortCode})`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="font-semibold text-slate-800">{viewingWarehouse.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Manager:</span>
                <span className="font-semibold text-slate-800">{viewingWarehouse.manager || 'Marcus Vance'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Code:</span>
                <span className="font-mono font-bold text-slate-900">{viewingWarehouse.shortCode}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2">
                Sub-Locations Inside {viewingWarehouse.name}
              </h4>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {locations.filter((l) => l.warehouseId === viewingWarehouse.id || l.warehouseName === viewingWarehouse.name).length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No locations configured yet for this warehouse.</div>
                ) : (
                  locations
                    .filter((l) => l.warehouseId === viewingWarehouse.id || l.warehouseName === viewingWarehouse.name)
                    .map((loc) => (
                      <div key={loc.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{loc.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{loc.type}</span>
                        </div>
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {loc.shortCode}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingWarehouse(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? All associated storage locations will also be unlinked."
      />
    </div>
  );
};
