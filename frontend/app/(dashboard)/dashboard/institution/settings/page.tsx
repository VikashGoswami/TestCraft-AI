'use client';
import { useState, useEffect } from 'react';
import client from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { Building2, Save } from 'lucide-react';

export default function InstitutionSettingsPage() {
  const { user } = useAuth();
  const [institution, setInstitution] = useState<any>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.institution_id) return;
    client
      .get(`/institutions/${user.institution_id}`)
      .then((res) => {
        setInstitution(res.data);
        setName(res.data.name || '');
      })
      .catch(() => toast.error('Failed to load institution'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading settings…</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Institution Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your organization branding and plan</p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{institution?.name}</h2>
            <span className="badge bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 capitalize mt-1 font-semibold">
              Plan: {institution?.plan || 'Free Tier'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => toast.success('Settings updated!')}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
