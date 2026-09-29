'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import client from '@/lib/api/client';
import toast from 'react-hot-toast';
import { ArrowLeft, UserPlus, FileCheck } from 'lucide-react';
import Link from 'next/link';

export default function ClassDetailPage() {
  const { classId } = useParams() as { classId: string };
  const [students, setStudents] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [studentsRes, testsRes] = await Promise.all([
        client.get(`/classes/${classId}/students`).catch(() => ({ data: [] })),
        client.get(`/tests`).catch(() => ({ data: { data: [] } })),
      ]);
      setStudents(studentsRes.data || []);
      setTests(testsRes.data?.data || []);
    } catch {
      toast.error('Failed to load class info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await client.post(`/classes/${classId}/students`, { email });
      toast.success('Student enrolled in class');
      setEmail('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not enroll student');
    }
  };

  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) return;

    try {
      await client.post(`/classes/${classId}/assign-test`, { test_id: Number(selectedTestId) });
      toast.success('Test assigned to class students!');
      setSelectedTestId('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign test');
    }
  };

  if (loading) return <div className="p-8">Loading class details…</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/classes" className="btn-secondary p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Details</h1>
          <p className="text-sm text-gray-500">Manage enrolled students and assign assessments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Enroll Student */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Enroll Student by Email
          </h2>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
              <input
                type="email"
                className="input"
                placeholder="student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Enroll Student
            </button>
          </form>
        </div>

        {/* Assign Assessment */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-purple-600" />
            Assign Assessment to Class
          </h2>
          <form onSubmit={handleAssignTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Test</label>
              <select
                className="input"
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                required
              >
                <option value="">-- Choose a test --</option>
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">
              Publish &amp; Assign
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

