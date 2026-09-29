'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import client from '@/lib/api/client';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private — only you can access' },
  { value: 'invite_only', label: 'Invite Only — anyone with the share link' },
  { value: 'public', label: 'Public — listed publicly' },
];

const THEME_OPTIONS = [
  { value: 'focused', label: '🎯 Focused — clean minimal layout' },
  { value: 'corporate', label: '💼 Corporate — professional branding' },
  { value: 'custom', label: '🎨 Custom — set your own colors' },
];

interface TestFormData {
  title: string;
  description: string;
  duration_minutes: number;
  visibility: string;
  passing_score: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  status: string;
  has_negative_marking: boolean;
  negative_mark: number;
  theme: string;
  primary_color: string;
  accent_color: string;
}

export default function NewTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TestFormData>({
    title: '',
    description: '',
    duration_minutes: 30,
    visibility: 'private',
    passing_score: 60,
    shuffle_questions: false,
    shuffle_options: false,
    status: 'draft',
    has_negative_marking: false,
    negative_mark: 0.25,
    theme: 'focused',
    primary_color: '#4F46E5',
    accent_color: '#0D9488',
  });

  const updateForm = <K extends keyof TestFormData>(key: K, value: TestFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setLoading(true);
    try {
      // Create test
      const res = await client.post('/tests', {
        title: form.title,
        description: form.description,
        duration_minutes: form.duration_minutes,
        visibility: form.visibility,
        passing_score: form.passing_score,
        shuffle_questions: form.shuffle_questions,
        shuffle_options: form.shuffle_options,
        status: form.status,
        has_negative_marking: form.has_negative_marking,
        negative_mark: form.has_negative_marking ? form.negative_mark : 0,
      });
      const testId = res.data.data?.id ?? res.data.id;

      // Apply theme
      try {
        await client.post(`/tests/${testId}/theme`, {
          template_key: form.theme,
          primary_color: form.primary_color,
          accent_color: form.accent_color,
        });
      } catch {
        // Theme is optional — don't block
      }

      toast.success('Test created! Now add your questions.');
      router.push(`/dashboard/tests/${testId}/questions`);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors)
          .flat()
          .forEach((msg: any) => toast.error(msg));
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to create test');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/tests" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Tests
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create New Test</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure your test settings. You will add questions or import exam papers in the next step.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Biology Chapter 5 — Cell Division"
              value={form.title}
              onChange={e => updateForm('title', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Optional description shown to participants before the test"
              value={form.description}
              onChange={e => updateForm('description', e.target.value)}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Test Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Duration (minutes)
              </label>
              <input
                className="input"
                type="number"
                min={1}
                max={360}
                value={form.duration_minutes}
                onChange={e => updateForm('duration_minutes', parseInt(e.target.value, 10))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Passing Score (%)
              </label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={form.passing_score}
                onChange={e => updateForm('passing_score', parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Visibility</label>
              <select
                className="input"
                value={form.visibility}
                onChange={e => updateForm('visibility', e.target.value)}
              >
                {VISIBILITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={e => updateForm('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Negative Marking */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Scoring Rules</h2>
          <ToggleRow
            label="Enable Negative Marking"
            description="Deduct marks for incorrect answers to discourage guessing."
            checked={form.has_negative_marking}
            onChange={v => updateForm('has_negative_marking', v)}
          />
          {form.has_negative_marking && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Deduction per wrong answer (fraction of question marks)
                </label>
                <select
                  className="input"
                  value={form.negative_mark}
                  onChange={e => updateForm('negative_mark', parseFloat(e.target.value))}
                >
                  <option value={0.25}>¼ mark (e.g. 4 wrong = −1 mark)</option>
                  <option value={0.33}>⅓ mark (e.g. 3 wrong = −1 mark)</option>
                  <option value={0.5}>½ mark (e.g. 2 wrong = −1 mark)</option>
                  <option value={1}>1 mark (1 wrong = −1 mark)</option>
                </select>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ⚠️ Example: If a question is worth <strong>2 marks</strong> and negative mark is{' '}
                <strong>¼</strong>, each wrong answer deducts{' '}
                <strong>{(2 * form.negative_mark).toFixed(2)} marks</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Shuffle options */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Randomisation</h2>
          <ToggleRow
            label="Shuffle Questions"
            description="Present questions in a random order for each participant."
            checked={form.shuffle_questions}
            onChange={v => updateForm('shuffle_questions', v)}
          />
          <ToggleRow
            label="Shuffle Options"
            description="Present answer options in a random order for each question."
            checked={form.shuffle_options}
            onChange={v => updateForm('shuffle_options', v)}
          />
        </div>

        {/* Theme */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Theme</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Template</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateForm('theme', opt.value)}
                  className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    form.theme === opt.value
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {form.theme === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => updateForm('primary_color', e.target.value)}
                    className="h-10 w-12 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                  />
                  <input
                    className="input flex-1"
                    type="text"
                    value={form.primary_color}
                    onChange={e => updateForm('primary_color', e.target.value)}
                    placeholder="#4F46E5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={e => updateForm('accent_color', e.target.value)}
                    className="h-10 w-12 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                  />
                  <input
                    className="input flex-1"
                    type="text"
                    value={form.accent_color}
                    onChange={e => updateForm('accent_color', e.target.value)}
                    placeholder="#0D9488"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/tests" className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating…' : 'Create Test & Add Questions →'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
