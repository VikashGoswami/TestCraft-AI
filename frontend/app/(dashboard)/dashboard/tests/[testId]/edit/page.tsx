'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import client from '@/lib/api/client';
import type { Test } from '@/lib/types';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private — only you can access' },
  { value: 'invite_only', label: 'Invite Only — anyone with the share link' },
  { value: 'public', label: 'Public — listed publicly' },
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
}

export default function EditTestPage() {
  const router = useRouter();
  const { testId } = useParams() as { testId: string };
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
  });

  useEffect(() => {
    client
      .get(`/tests/${testId}`)
      .then(r => {
        const t: Test = r.data.data ?? r.data;
        setForm({
          title: t.title,
          description: t.description ?? '',
          duration_minutes: t.duration_minutes,
          visibility: t.visibility,
          passing_score: t.passing_score ?? 60,
          shuffle_questions: t.shuffle_questions ?? false,
          shuffle_options: t.shuffle_options ?? false,
          status: t.status ?? 'draft',
          has_negative_marking: t.has_negative_marking ?? false,
          negative_mark: t.negative_mark ?? 0.25,
        });
      })
      .catch(() => toast.error('Failed to load test'))
      .finally(() => setFetching(false));
  }, [testId]);

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
      await client.patch(`/tests/${testId}`, {
        ...form,
        negative_mark: form.has_negative_marking ? form.negative_mark : 0,
      });
      toast.success('Test updated');
      router.push(`/dashboard/tests/${testId}/questions`);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors)
          .flat()
          .forEach((msg: any) => toast.error(msg));
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to update test');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/tests/${testId}/questions`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Questions
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Edit Test Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update your test timing, negative marking, and visibility rules.</p>
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
                <option value="archived">Archived</option>
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

        <div className="flex gap-3">
          <Link href={`/dashboard/tests/${testId}/questions`} className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving…' : 'Save Changes'}
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
