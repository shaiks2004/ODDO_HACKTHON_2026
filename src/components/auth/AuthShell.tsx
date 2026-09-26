import React, { ReactNode } from 'react';
import { Boxes } from 'lucide-react';

interface AuthShellProps {
  children: ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Boxes className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            <span>StockSense</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300">
              ERP
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Smart Inventory. Simple Operations.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-7 px-6 border border-slate-200 rounded-lg sm:px-8 shadow-xs">
          {children}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-mono">
          StockSense Enterprise Frontend &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
