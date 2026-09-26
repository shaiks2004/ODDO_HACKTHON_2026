import React from 'react';
import { StockStatus, OperationStatus } from '../../types/inventory';

type BadgeStatus = StockStatus | OperationStatus | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStatusStyles = (val: string) => {
    switch (val) {
      case 'In Stock':
      case 'Done':
        return {
          dot: 'bg-emerald-600',
          text: 'text-emerald-800',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
        };
      case 'Low Stock':
      case 'Waiting':
      case 'Pick':
        return {
          dot: 'bg-amber-600',
          text: 'text-amber-800',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        };
      case 'Out of Stock':
      case 'Canceled':
        return {
          dot: 'bg-rose-600',
          text: 'text-rose-800',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
        };
      case 'Ready':
      case 'Pack':
        return {
          dot: 'bg-blue-600',
          text: 'text-blue-800',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'Draft':
      default:
        return {
          dot: 'bg-slate-400',
          text: 'text-slate-700',
          bg: 'bg-slate-100',
          border: 'border-slate-200',
        };
    }
  };

  const style = getStatusStyles(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded ${style.bg} ${style.border} border ${style.text} ${sizeClasses} whitespace-nowrap tracking-tight`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

