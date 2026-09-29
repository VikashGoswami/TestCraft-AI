'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'individual', label: 'Individual' },
  { value: 'institution_admin', label: 'Institution Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<string>('individual');
  const [loading, setLoading] = useState(false);

  const handleFillDemo = (targetRole: string = 'individual') => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const rolePrefixes: Record<string, string> = {
      individual: 'Demo Creator',
      teacher: 'Prof. Demo',
      student: 'Demo Student',
      institution_admin: 'Admin Demo',
    };
    setName(`${rolePrefixes[targetRole] || 'Demo User'} ${randomId}`);
    setEmail(`test_${targetRole}_${randomId}@example.com`);
    setPassword('password123');
    setPasswordConfirmation('password123');
    setRole(targetRole);
    toast.success(`Filled demo data for ${targetRole}! Click "Create account".`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, password_confirmation: passwordConfirmation, role });
      await refetch();
      toast.success('Account created! Welcome to your dashboard.');
      window.location.href = '/dashboard';
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((msg: any) => toast.error(msg));
      } else {
        toast.error(err.response?.data?.message ?? 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Create your account</h1>

        {/* Quick Demo Fill Buttons */}
        <div className="mb-5 p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
          <div className="text-xs font-semibold text-blue-800 mb-2 flex items-center justify-between">
            <span>⚡ Quick Demo Registration</span>
            <span className="text-[10px] text-blue-600 font-normal">Auto-generates dummy data</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleFillDemo('individual')}
              className="text-xs px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded font-medium text-left transition-colors"
            >
              👤 Fill as Individual
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('teacher')}
              className="text-xs px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium text-left transition-colors"
            >
              👨‍🏫 Fill as Teacher
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('student')}
              className="text-xs px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium text-left transition-colors"
            >
              🎓 Fill as Student
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('institution_admin')}
              className="text-xs px-2.5 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded font-medium text-left transition-colors"
            >
              🏫 Fill as Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              className="input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              className="input"
              type="password"
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a…</label>
            <select
              className="input"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="mt-4">
          <GoogleSignInButton />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

