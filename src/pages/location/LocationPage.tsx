import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  MapPin,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  Edit2,
  Trash2,
  Eye,
  Check,
  Building,
} from 'lucide-react';
import { Location } from '../../types/inventory';

export const LocationPage: React.FC = () => {
  const { locations, warehouses, addLocation, updateLocation, deleteLocation } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formShortCode, setFormShortCode] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState(warehouses[0]?.id || '');
  const [formType, setFormType] = useState<Location['type']>('Storage Rack');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        searchQuery === '' ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.warehouseName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWarehouse =
        warehouseFilter === 'All' || loc.warehouseName === warehouseFilter;

      return matchesSearch && matchesWarehouse;
    });
  }, [locations, searchQuery, warehouseFilter]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormShortCode('');
    setFormWarehouseId(warehouses[0]?.id || '');
    setFormType('Storage Rack');
    setFormDescription('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc);
    setFormName(loc.name);
    setFormShortCode(loc.shortCode);
    setFormWarehouseId(loc.warehouseId);
    setFormType(loc.type || 'Storage Rack');
    setFormDescription(loc.description || '');
    setFormError('');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formShortCode.trim() || !formWarehouseId) {
      setFormError('Location name, short code, and parent warehouse are required.');
      return;
    }

    const parentWh = warehouses.find((w) => w.id === formWarehouseId);
    if (!parentWh) {
      setFormError('Please select a valid parent warehouse.');
      return;
    }

    addLocation({
      name: formName.trim(),
      shortCode: formShortCode.trim().toUpperCase(),
      warehouseId: parentWh.id,
      warehouseName: parentWh.name,
      type: formType,
      description: formDescription.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    if (!formName.trim() || !formShortCode.trim() || !formWarehouseId) {
      setFormError('Location name, short code, and warehouse are required.');
      return;
    }

    const parentWh = warehouses.find((w) => w.id === formWarehouseId);
    if (!parentWh) {
      setFormError('Please select a valid warehouse.');
      return;
    }

    updateLocation(editingLocation.id, {
      name: formName.trim(),
      shortCode: formShortCode.trim().toUpperCase(),
      warehouseId: parentWh.id,
      warehouseName: parentWh.name,
      type: formType,
      description: formDescription.trim(),
    });

    setEditingLocation(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteLocation(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Locations"
        subtitle="Manage sub-locations, aisles, bays, and storage racks within warehouses"
        actions={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Location</span>
          </button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search location by name or short code..."
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
              <option value="All">All Parent Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.name}>
                  {wh.name} ({wh.shortCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Wireframe Matching Location Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Short Code</th>
                <th className="py-3.5 px-4">Parent Warehouse</th>
                <th className="py-3.5 px-4">Location Type</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No locations found.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {loc.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {loc.shortCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-medium">
                      <div className="flex items-center gap-1.5">
                        <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{loc.warehouseName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {loc.type || 'Storage Rack'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {loc.description || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingLocation(loc)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="View Location"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(loc)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Edit Location"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(loc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Delete Location"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Location Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Warehouse Location"
        subtitle="A location belongs directly to a warehouse facility"
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
              Parent Warehouse <span className="text-rose-500">*</span>
            </label>
            <select
              value={formWarehouseId}
              onChange={(e) => setFormWarehouseId(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.shortCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Rack Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Production Rack"
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
                placeholder="e.g. PR-01"
                value={formShortCode}
                onChange={(e) => setFormShortCode(e.target.value)}
                className="w-full text-xs font-mono uppercase p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              >
                <option value="Storage Rack">Storage Rack</option>
                <option value="Production Floor">Production Floor</option>
                <option value="Receiving Dock">Receiving Dock</option>
                <option value="Dispatch Bay">Dispatch Bay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Tier 2 storage for CNC raw material"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
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
              <span>Create Location</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Location Modal */}
      {editingLocation && (
        <Modal
          isOpen={Boolean(editingLocation)}
          onClose={() => setEditingLocation(null)}
          title={`Edit Location: ${editingLocation.name}`}
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
                Parent Warehouse <span className="text-rose-500">*</span>
              </label>
              <select
                value={formWarehouseId}
                onChange={(e) => setFormWarehouseId(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location Name <span className="text-rose-500">*</span>
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
                  Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                >
                  <option value="Storage Rack">Storage Rack</option>
                  <option value="Production Floor">Production Floor</option>
                  <option value="Receiving Dock">Receiving Dock</option>
                  <option value="Dispatch Bay">Dispatch Bay</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingLocation(null)}
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

      {/* View Location Modal */}
      {viewingLocation && (
        <Modal
          isOpen={Boolean(viewingLocation)}
          onClose={() => setViewingLocation(null)}
          title={`Location: ${viewingLocation.name} (${viewingLocation.shortCode})`}
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Warehouse:</span>
                <span className="font-semibold text-slate-900">{viewingLocation.warehouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Short Code:</span>
                <span className="font-mono font-bold text-slate-900">{viewingLocation.shortCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="font-medium text-slate-800">{viewingLocation.type || 'Storage Rack'}</span>
              </div>
              {viewingLocation.description && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Notes:</span>
                  <p className="text-slate-700">{viewingLocation.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingLocation(null)}
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
        title="Delete Location"
        message="Are you sure you want to delete this warehouse location?"
      />
    </div>
  );
};
