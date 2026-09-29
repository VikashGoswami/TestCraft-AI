'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import client from '@/lib/api/client';
import toast from 'react-hot-toast';
import { User, BookOpen, Building2, GraduationCap } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

const ROLE_OPTIONS = [
  {
    value: 'individual',
    label: "I'm an Individual",
    description: 'Create and take tests for personal practice or competitive exams.',
    icon: User,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-slate-200 dark:border-slate-800',
    activeBorder: 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20',
  },
  {
    value: 'teacher',
    label: "I'm an Educator / Teacher",
    description: 'Build tests, digitize exam papers with AI, and track cohort analytics.',
    icon: BookOpen,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    border: 'border-slate-200 dark:border-slate-800',
    activeBorder: 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20',
  },
  {
    value: 'institution_admin',
    label: 'I manage an Institution',
    description: 'Manage teachers, students, and institutional testing programs.',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-slate-200 dark:border-slate-800',
    activeBorder: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500/20',
  },
  {
    value: 'student',
    label: "I'm an Applicant / Student",
    description: 'Take proctored CBT tests and review AI solutions and short tricks.',
    icon: GraduationCap,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-slate-200 dark:border-slate-800',
    activeBorder: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-2 ring-amber-500/20',
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col justify-between px-4 py-8">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <Logo size="md" showTagline />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl mx-auto my-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">
            Choose your primary role so TestCraft-AI can tailor your assessment experience.
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
                className={`text-left p-6 rounded-2xl border-2 transition-all duration-150 ${
                  isSelected
                    ? `${option.activeBorder} shadow-md`
                    : `border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm`
                }`}
              >
                <div className={`inline-flex p-3 rounded-xl ${option.bg} mb-4`}>
                  <Icon className={`h-6 w-6 ${option.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">{option.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{option.description}</p>
                {isSelected && (
                  <div className="mt-4 flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={saving || !selectedRole}
          className="btn-primary w-full py-3.5 text-base font-bold shadow-lg shadow-indigo-500/25"
        >
          {saving ? 'Configuring your workspace…' : 'Continue to Dashboard →'}
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full text-center text-xs text-slate-400 dark:text-slate-500 pt-6">
        TestCraft-AI &bull; Next-Gen AI Assessment Platform
      </div>
    </div>
  );
}
