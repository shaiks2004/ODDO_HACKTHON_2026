import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useInventory();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let colorClasses = 'border-emerald-200 bg-white text-emerald-900 shadow-lg';
        let iconColor = 'text-emerald-600';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          colorClasses = 'border-rose-200 bg-white text-rose-900 shadow-lg';
          iconColor = 'text-rose-600';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          colorClasses = 'border-amber-200 bg-white text-amber-900 shadow-lg';
          iconColor = 'text-amber-600';
        } else if (toast.type === 'info') {
          Icon = Info;
          colorClasses = 'border-slate-200 bg-white text-slate-900 shadow-lg';
          iconColor = 'text-blue-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border transition-all duration-200 ${colorClasses}`}
            role="status"
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded hover:bg-slate-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
