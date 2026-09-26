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
  const badgeClasses = {
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    negative: 'text-rose-700 bg-rose-50 border-rose-200',
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    neutral: 'text-slate-700 bg-slate-100 border-slate-200',
  };

  const content = (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-slate-500 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs font-semibold text-slate-500 uppercase">{unit}</span>}
      </div>

      {(subtext || badge) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-500 text-[11px]">{subtext}</span>}
          {badge && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border font-mono ${
                badgeClasses[badge.variant] || badgeClasses.neutral
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
      <Link to={to} className="block group focus:outline-none focus:ring-1 focus:ring-slate-900 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};

