'use client';
import { useState, useEffect } from 'react';
import client from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Plus } from 'lucide-react';

export default function TeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const fetchTeachers = async () => {
    if (!user?.institution_id) return;
    try {
      const res = await client.get(`/institutions/${user.institution_id}/teachers`);
      setTeachers(res.data || []);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user?.institution_id) return;

    setInviting(true);
    try {
      await client.post(`/institutions/${user.institution_id}/teachers`, { email });
      toast.success('Teacher invited successfully!');
      setEmail('');
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite teacher');
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading teachers…</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manage Teachers</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Invite faculty and staff to build and assign assessments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Invite Card */}
        <div className="card p-6 h-fit space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Invite Teacher
          </h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={inviting} className="btn-primary w-full">
              {inviting ? 'Inviting…' : 'Send Invitation'}
            </button>
          </form>
        </div>

        {/* Teachers List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-slate-400" />
            Faculty Members ({teachers.length})
          </h2>

          {teachers.length === 0 ? (
            <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
              No teachers added yet. Invite your colleagues using the form!
            </div>
          ) : (
            <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {teachers.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-sm">
                      {m.user?.name?.[0] || 'T'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{m.user?.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {m.user?.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`badge capitalize font-semibold ${
                      m.status === 'active' ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
