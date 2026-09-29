'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import client from '@/lib/api/client';
import toast from 'react-hot-toast';
import { User, BookOpen, Building2, GraduationCap } from 'lucide-react';

const ROLE_OPTIONS = [
  {
    value: 'individual',
    label: "I'm an Individual",
    description: 'Create and take tests for personal practice or self-assessment.',
    icon: User,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500 bg-blue-50',
  },
  {
    value: 'teacher',
    label: "I'm a Teacher",
    description: 'Build tests for your classes, track student progress and results.',
    icon: BookOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-500 bg-emerald-50',
  },
  {
    value: 'institution_admin',
    label: 'I manage an Institution',
    description: 'Manage teachers, students and organisation-wide testing programs.',
    icon: Building2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    activeBorder: 'border-purple-500 bg-purple-50',
  },
  {
    value: 'student',
    label: "I'm a Student",
    description: 'Take tests assigned by your teacher and view your progress.',
    icon: GraduationCap,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBorder: 'border-amber-500 bg-amber-50',
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refetch } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue.');
      return;
    }
    setSaving(true);
    try {
      await client.patch('/auth/me', { role: selectedRole });
      await refetch();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            Tell us a bit about yourself so we can personalise your experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {ROLE_OPTIONS.map(option => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedRole(option.value)}
                className={`text-left p-6 rounded-xl border-2 transition-all duration-150 ${
                  isSelected
                    ? `${option.activeBorder} shadow-md`
                    : `border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm`
                }`}
              >
                <div className={`inline-flex p-2.5 rounded-lg ${option.bg} mb-4`}>
                  <Icon className={`h-6 w-6 ${option.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-1">{option.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{option.description}</p>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${option.bg} border-2 ${option.color.replace('text-', 'border-')}`} />
                    <span className={`text-xs font-semibold ${option.color}`}>Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={saving || !selectedRole}
          className="btn-primary w-full py-3 text-base"
        >
          {saving ? 'Setting up your account…' : 'Continue to Dashboard'}
        </button>
      </div>
    </div>
  );
}

