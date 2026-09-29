'use client';
import { useState, useEffect } from 'react';
import client from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { Users2, Plus, ArrowRight, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Student Join Code State
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const isStudent = user?.roles?.includes('student');

  const fetchClasses = async () => {
    try {
      if (isStudent) {
        const res = await client.get('/classes/my');
        setClasses(res.data || []);
      } else if (user?.institution_id) {
        const res = await client.get(`/institutions/${user.institution_id}/classes`);
        setClasses(res.data || []);
      } else {
        setClasses([]);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user?.institution_id) return;

    setCreating(true);
    try {
      await client.post(`/institutions/${user.institution_id}/classes`, { name });
      toast.success('Class created!');
      setName('');
      fetchClasses();
    } catch {
      toast.error('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    try {
      await client.post('/classes/join', { join_code: joinCode });
      toast.success('Joined class successfully!');
      setJoinCode('');
      fetchClasses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid join code');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="p-8">Loading classes…</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isStudent ? 'My Enrolled Classes' : 'Class Management'}
        </h1>
        <p className="text-sm text-gray-500">
          {isStudent
            ? 'Access tests assigned specifically to your section'
            : 'Organize students into batches and assign customized test papers'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Form: Create Class (Teachers/Admins) or Join Class (Students) */}
        <div className="card p-6 h-fit space-y-4">
          {isStudent ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" />
                Join via Code
              </h2>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Code</label>
                  <input
                    type="text"
                    className="input uppercase font-mono tracking-widest text-center"
                    placeholder="e.g. 6XYZ89"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={joining} className="btn-primary w-full">
                  {joining ? 'Joining…' : 'Join Class'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Create New Class
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Section 10-A, Physics Batch"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={creating} className="btn-primary w-full">
                  {creating ? 'Creating…' : 'Create Class'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Classes List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users2 className="h-5 w-5 text-gray-500" />
            Active Sections ({classes.length})
          </h2>

          {classes.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No classes found. {isStudent ? 'Enter a code to join one!' : 'Create one to get started.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="card p-6 flex flex-col justify-between space-y-4 hover:border-gray-300 transition-all">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cls.students_count || 0} Enrolled Students
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                      Code: {cls.join_code}
                    </span>
                    {!isStudent && (
                      <Link
                        href={`/dashboard/classes/${cls.id}`}
                        className="text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                      >
                        Manage <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

