import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Settings,
  Warehouse,
  Boxes,
  Bell,
  Check,
  RotateCcw,
  Save,
} from 'lucide-react';
import { UnitOfMeasure } from '../../types/inventory';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, warehouses, showToast, resetToDemoData } = useInventory();

  const [formData, setFormData] = useState({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleReset = () => {
    const defaults = {
      defaultWarehouse: 'Main Warehouse',
      lowStockThreshold: 20,
      defaultUnit: 'kg' as UnitOfMeasure,
      notificationsEnabled: true,
    };
    setFormData(defaults);
    updateSettings(defaults);
    showToast('info', 'Settings Reset', 'Configuration restored to defaults.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Settings & System Configuration"
        subtitle="Configure default warehouse locations, global thresholds, and alert notifications"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Warehouse Settings Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Warehouse Preferences</h2>
              <p className="text-xs text-slate-500">Configure default routing for receipts and stock allocation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Primary Warehouse
              </label>
              <select
                value={formData.defaultWarehouse}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultWarehouse: e.target.value,
                  }))
                }
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Pre-selected warehouse for new order forms and receipts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Unit of Measure
              </label>
              <select
                value={formData.defaultUnit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultUnit: e.target.value as UnitOfMeasure,
                  }))
                }
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none font-mono"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="pcs">pcs (Pieces)</option>
                <option value="m">m (Meters)</option>
                <option value="liters">liters (Liters)</option>
                <option value="boxes">boxes (Boxes)</option>
                <option value="sets">sets (Sets)</option>
                <option value="rolls">rolls (Rolls)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Rules Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inventory & Threshold Rules</h2>
              <p className="text-xs text-slate-500">Thresholds for replenishment warnings and ledger integrity.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Global Default Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lowStockThreshold: parseInt(e.target.value, 10) || 10,
                  }))
                }
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Products falling below this quantity will flag an automatic reorder notice.
              </span>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationsEnabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Enable Operational Alerts
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Show badge indicators for low stock and pending receipts.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Development & Data Source Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Development & Data Source</h2>
              <p className="text-xs text-slate-500">Development-only controls for prototype testing and backend data integration.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Configured Data Source:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {import.meta.env.VITE_DATA_SOURCE || 'mock'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Backend API Base URL:</span>
              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Note: When connecting a real backend API, update <code className="font-mono text-slate-800">VITE_DATA_SOURCE=api</code> in your environment variables.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Reset Mock Inventory Dataset</span>
              <span className="text-[11px] text-slate-500 block">Restores demo products, warehouses, receipts, and move history to factory initial state.</span>
            </div>
            <button
              type="button"
              onClick={resetToDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
