'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import client from '@/lib/api/client';
import { ChevronLeft, ArrowRight, Sparkles, Settings2, ShieldCheck, Palette, Shuffle } from 'lucide-react';
import toast from 'react-hot-toast';

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private (Only you)' },
  { value: 'invite_only', label: 'Invite Only (Via share link)' },
  { value: 'public', label: 'Public (Open)' },
];

const THEME_OPTIONS = [
  { value: 'focused', label: '🎯 Focused', desc: 'Minimal CBT' },
  { value: 'corporate', label: '💼 Corporate', desc: 'TCS iON multi-panel' },
  { value: 'custom', label: '🎨 Custom', desc: 'Custom branding' },
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
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Test title is required');
      return;
    }
    setLoading(true);
    try {
      // 1. Create test
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

      // 2. Apply theme
      try {
        await client.post(`/tests/${testId}/theme`, {
          template_key: form.theme,
          primary_color: form.primary_color,
          accent_color: form.accent_color,
        });
      } catch {
        // Theme is optional — do not block
      }

      toast.success('Test created! Now add or import questions.');
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <Link
            href="/dashboard/tests"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-1 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Tests
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create New Test
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set up assessment details, scoring rules, and candidate test interface in one place.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/dashboard/tests" className="btn-secondary py-2 px-3 text-xs">
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            {loading ? (
              'Creating…'
            ) : (
              <>
                Create &amp; Add Questions
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Single-Screen Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Test Metadata & Timing (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Basic Information */}
          <div className="card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Assessment Details
              </h2>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Step 1 of 2</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Test Title <span className="text-rose-500">*</span>
              </label>
              <input
                className="input py-2 text-sm"
                type="text"
                placeholder="e.g. Physics Chapter 5 — Mechanics &amp; Kinematics"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Exam Syllabus <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                className="input py-2 text-sm"
                type="text"
                placeholder="Brief guidelines or candidate instructions shown before start..."
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
              />
            </div>

            {/* 4 Core Settings in Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration <span className="text-slate-400 font-normal">(mins)</span>
                </label>
                <input
                  className="input py-2 text-sm"
                  type="number"
                  min={1}
                  max={360}
                  value={form.duration_minutes}
                  onChange={(e) => updateForm('duration_minutes', parseInt(e.target.value, 10) || 30)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pass Mark <span className="text-slate-400 font-normal">(%)</span>
                </label>
                <input
                  className="input py-2 text-sm"
                  type="number"
                  min={0}
                  max={100}
                  value={form.passing_score}
                  onChange={(e) => updateForm('passing_score', parseInt(e.target.value, 10) || 60)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Visibility
                </label>
                <select
                  className="input py-2 text-xs"
                  value={form.visibility}
                  onChange={(e) => updateForm('visibility', e.target.value)}
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Status
                </label>
                <select
                  className="input py-2 text-xs"
                  value={form.status}
                  onChange={(e) => updateForm('status', e.target.value)}
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Question Randomisation Toggles */}
          <div className="card p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shuffle className="h-3.5 w-3.5 text-indigo-500" />
              Anti-Cheating &amp; Question Delivery
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CompactToggle
                label="Shuffle Questions"
                desc="Randomize question sequence for each applicant"
                checked={form.shuffle_questions}
                onChange={(v) => updateForm('shuffle_questions', v)}
              />
              <CompactToggle
                label="Shuffle Options"
                desc="Shuffle choices (A/B/C/D) per question"
                checked={form.shuffle_options}
                onChange={(v) => updateForm('shuffle_options', v)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Scoring Rules & Theme (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 3: Scoring & Negative Marking */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Scoring &amp; Negative Marking
              </h2>
              {form.has_negative_marking && (
                <span className="badge bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px]">
                  Penalty Active
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Enable Negative Marking</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Deduct marks for incorrect answers</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.has_negative_marking}
                onClick={() => updateForm('has_negative_marking', !form.has_negative_marking)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                  form.has_negative_marking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    form.has_negative_marking ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {form.has_negative_marking && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2 animate-in fade-in duration-150">
                <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                  Deduction fraction per wrong answer:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: 0.25, label: '¼ (0.25)' },
                    { val: 0.33, label: '⅓ (0.33)' },
                    { val: 0.5, label: '½ (0.50)' },
                    { val: 1.0, label: '1 (1.00)' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => updateForm('negative_mark', item.val)}
                      className={`py-1 px-1.5 rounded-lg text-xs font-bold transition-all ${
                        form.negative_mark === item.val
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-tight">
                  💡 On a 2-mark question, an error deducts{' '}
                  <strong>{(2 * form.negative_mark).toFixed(2)} marks</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Card 4: CBT Template & Brand Colors */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Exam Interface &amp; Theme
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateForm('theme', opt.value)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    form.theme === opt.value
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] opacity-75 truncate">{opt.desc}</p>
                </button>
              ))}
            </div>

            {form.theme === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => updateForm('primary_color', e.target.value)}
                      className="h-8 w-9 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      className="input py-1 px-2 text-xs font-mono"
                      type="text"
                      value={form.primary_color}
                      onChange={(e) => updateForm('primary_color', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={(e) => updateForm('accent_color', e.target.value)}
                      className="h-8 w-9 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      className="input py-1 px-2 text-xs font-mono"
                      type="text"
                      value={form.accent_color}
                      onChange={(e) => updateForm('accent_color', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Submit Strip */}
          <div className="flex items-center gap-3 pt-1">
            <Link href="/dashboard/tests" className="btn-secondary py-2.5 px-4 text-xs font-medium flex-1 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2.5 px-5 text-xs font-bold flex-[2] flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              {loading ? (
                'Creating…'
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Create Test &amp; Add Questions
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CompactToggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
        checked
          ? 'border-indigo-500/60 bg-indigo-50/40 dark:bg-indigo-950/30'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div>
        <p className="text-xs font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
