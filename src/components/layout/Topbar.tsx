import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { DATA_SOURCE } from '../../config/dataSource';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';
import {
  Menu,
  Search,
  Bell,
  Warehouse,
  ChevronDown,
} from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { profile, settings, updateSettings, warehouses, products, receipts, deliveries } = useInventory();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount =
    products.filter((p) => p.onHand <= p.reorderLevel).length +
    receipts.filter((r) => r.status === 'Ready' || r.status === 'Waiting').length +
    deliveries.filter((d) => d.status === 'Ready' || d.status === 'Waiting').length;

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu & Quick Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Trigger Input Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full max-w-md flex items-center justify-between px-3 py-1.5 bg-slate-100/90 hover:bg-slate-100 text-slate-500 rounded text-xs border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search inventory, orders, SKUs...</span>
            </div>
            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-500 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Subtle Data Source Indicator for Developers */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200 bg-slate-50 text-slate-500"
            title={`Data layer mode: VITE_DATA_SOURCE=${DATA_SOURCE}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                DATA_SOURCE === 'api' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>Data: {DATA_SOURCE === 'api' ? 'API' : 'Demo'}</span>
          </div>

          {/* Active Warehouse Context Dropdown */}
          <div className="relative hidden md:flex items-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded">
              <Warehouse className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Facility:</span>
              <select
                value={settings.defaultWarehouse}
                onChange={(e) =>
                  updateSettings({ defaultWarehouse: e.target.value as any })
                }
                className="bg-transparent border-none text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
                aria-label="Select default warehouse"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-1" />
            </div>
          </div>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
            />
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile Thumbnail */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1 rounded hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
              {(profile?.name || 'User')
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase() || 'U'}
            </div>
            <div className="hidden xl:block">
              <span className="text-xs font-semibold text-slate-900 block leading-tight">
                {profile?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                {profile?.role || 'Staff'}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
