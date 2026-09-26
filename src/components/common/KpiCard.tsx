import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'negative' | 'neutral';
  };
  to?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subtext,
  icon: Icon,
  badge,
  to,
}) => {
  const content = (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-slate-500 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>

      {(subtext || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-500">{subtext}</span>}
          {badge && (
            <span
              className={`font-medium ${
                badge.variant === 'warning'
                  ? 'text-amber-700'
                  : badge.variant === 'negative'
                  ? 'text-rose-600'
                  : badge.variant === 'positive'
                  ? 'text-emerald-700'
                  : 'text-slate-600'
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block group focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};
