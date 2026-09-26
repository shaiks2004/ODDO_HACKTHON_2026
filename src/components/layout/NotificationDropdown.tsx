import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { Bell, CheckCheck, PackageX, Truck, FileCheck, Check } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { products, receipts, deliveries } = useInventory();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Compute live operational notifications
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      timestamp: string;
      type: 'low_stock' | 'receipt' | 'delivery';
      link: string;
    }> = [];

    // Low stock alerts
    products
      .filter((p) => p.onHand <= p.reorderLevel)
      .forEach((p) => {
        list.push({
          id: `low-${p.id}`,
          title: 'Low Stock Alert',
          description: `${p.name} (${p.sku}) is at ${p.onHand} ${p.unit} (reorder minimum: ${p.reorderLevel} ${p.unit})`,
          timestamp: 'Live Alert',
          type: 'low_stock',
          link: '/stock',
        });
      });

    // Pending receipts
    receipts
      .filter((r) => r.status === 'Ready' || r.status === 'Waiting')
      .forEach((r) => {
        list.push({
          id: `rec-${r.id}`,
          title: `Receipt ${r.reference} [${r.status}]`,
          description: `Supplier: ${r.supplier} · Scheduled for ${r.scheduleDate} at ${r.warehouseName}`,
          timestamp: r.scheduleDate,
          type: 'receipt',
          link: `/receipts/${r.id}`,
        });
      });

    // Pending deliveries
    deliveries
      .filter((d) => d.status === 'Ready' || d.status === 'Waiting')
      .forEach((d) => {
        list.push({
          id: `del-${d.id}`,
          title: `Delivery ${d.reference} [${d.status}]`,
          description: `Customer: ${d.customer} · Scheduled for ${d.scheduleDate} from ${d.warehouseName}`,
          timestamp: d.scheduleDate,
          type: 'delivery',
          link: `/delivery/${d.id}`,
        });
      });

    return list.filter((n) => !dismissedIds.includes(n.id));
  }, [products, receipts, deliveries, dismissedIds]);

  if (!isOpen) return null;

  const handleNotificationClick = (id: string, link: string) => {
    setDismissedIds((prev) => [...prev, id]);
    onClose();
    navigate(link);
  };

  const handleMarkAllRead = () => {
    setDismissedIds(notifications.map((n) => n.id));
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">Notifications</span>
          <span className="text-xs text-slate-500 font-mono">
            ({notifications.length} active)
          </span>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium hover:underline cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No pending operational alerts right now.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif.id, notif.link)}
              className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 bg-blue-50/20"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {notif.type === 'low_stock' ? (
                  <PackageX className="w-4 h-4 text-rose-500" />
                ) : notif.type === 'receipt' ? (
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Truck className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
