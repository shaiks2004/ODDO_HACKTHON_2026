import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { PageHeader } from '../../components/common/PageHeader';
import {
  User,
  Mail,
  Building,
  Shield,
  Phone,
  Save,
  CheckCircle2,
  Warehouse,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, warehouses } = useInventory();

  const [formData, setFormData] = useState({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage personal inventory permissions, contact information, and warehouse assignments"
      />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {/* Profile Card Banner */}
        <div className="h-28 bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-end">
          <div className="translate-y-10 flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-slate-800 text-2xl font-bold font-mono">
              {initials}
            </div>
            <div className="mb-2 text-white">
              <h2 className="text-lg font-bold leading-tight">{profile.name}</h2>
              <span className="text-xs text-slate-300 font-medium">
                {profile.role} · {profile.department}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-14 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile details saved successfully.</span>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Operational Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Warehouse Supervisor">Warehouse Supervisor</option>
                    <option value="Warehouse Staff">Warehouse Staff</option>
                    <option value="Logistics Specialist">Logistics Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, department: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                Base Warehouse Assignment
              </h3>

              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Base Facility
                </label>
                <div className="relative">
                  <Warehouse className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={formData.assignedWarehouse}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assignedWarehouse: e.target.value,
                      }))
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.name}>
                        {wh.name} ({wh.shortCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Authorized Warehouse Operator</span>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Update Profile</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
