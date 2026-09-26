import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import {
  Boxes,
  LayoutDashboard,
  PackageCheck,
  Warehouse,
  MapPin,
  FileCheck,
  Truck,
  History,
  Settings,
  User,
  LogOut,
  X,
  RotateCcw,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, profile, receipts, deliveries, resetToDemoData } = useInventory();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pendingReceipts = receipts.filter((r) => r.status !== 'Done' && r.status !== 'Canceled').length;
  const pendingDeliveries = deliveries.filter((d) => d.status !== 'Done' && d.status !== 'Canceled').length;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-slate-900 text-white font-semibold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
                <Boxes className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  StockSense
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight block">
                  Inventory Management
                </span>
              </div>
            </NavLink>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links according to Architecture */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Main Operations
            </div>

            <NavLink to="/dashboard" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </div>
            </NavLink>

            <NavLink to="/stock" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <PackageCheck className="w-4 h-4 shrink-0" />
                <span>Stock</span>
              </div>
            </NavLink>

            <div className="pt-2 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Warehouses & Locations
            </div>

            <NavLink to="/warehouse" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <Warehouse className="w-4 h-4 shrink-0" />
                <span>Warehouse</span>
              </div>
            </NavLink>

            <NavLink to="/location" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Location</span>
              </div>
            </NavLink>

            <div className="pt-2 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Inbound & Outbound
            </div>

            <NavLink to="/receipts" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Receipts</span>
              </div>
              {pendingReceipts > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {pendingReceipts}
                </span>
              )}
            </NavLink>

            <NavLink to="/delivery" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Delivery</span>
              </div>
              {pendingDeliveries > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {pendingDeliveries}
                </span>
              )}
            </NavLink>

            <div className="pt-2 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Audit & Ledger
            </div>

            <NavLink to="/move-history" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 shrink-0" />
                <span>Move History</span>
              </div>
            </NavLink>

            <NavLink to="/settings" onClick={onClose} className={navLinkClass}>
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </div>
            </NavLink>
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {profile.role}
              </p>
            </div>
            <User className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </NavLink>

          <div className="flex items-center gap-1 pt-1">
            <button
              onClick={resetToDemoData}
              title="Reset mock inventory data"
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
