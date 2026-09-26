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
          dot: 'bg-emerald-500',
          text: 'text-emerald-700',
          bg: 'bg-emerald-50/70',
          border: 'border-emerald-200/80',
        };
      case 'Low Stock':
      case 'Waiting':
      case 'Pick':
        return {
          dot: 'bg-amber-500',
          text: 'text-amber-800',
          bg: 'bg-amber-50/70',
          border: 'border-amber-200/80',
        };
      case 'Out of Stock':
      case 'Canceled':
        return {
          dot: 'bg-rose-500',
          text: 'text-rose-700',
          bg: 'bg-rose-50/70',
          border: 'border-rose-200/80',
        };
      case 'Ready':
      case 'Pack':
        return {
          dot: 'bg-blue-500',
          text: 'text-blue-700',
          bg: 'bg-blue-50/70',
          border: 'border-blue-200/80',
        };
      case 'Draft':
      default:
        return {
          dot: 'bg-slate-400',
          text: 'text-slate-700',
          bg: 'bg-slate-100/80',
          border: 'border-slate-200',
        };
    }
  };

  const style = getStatusStyles(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${style.bg} ${style.border} ${style.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
};
