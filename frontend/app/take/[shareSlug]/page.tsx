'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resolveShare, startAttempt } from '@/lib/api/attempts';
import { useAuth } from '@/lib/hooks/useAuth';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import {
  Clock,
  HelpCircle,
  CheckCircle2,
  ShieldAlert,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function TakeSharePage() {
  const { shareSlug } = useParams() as { shareSlug: string };
  const router = useRouter();
  const { user } = useAuth();

  const [shareData, setShareData] = useState<any>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!shareSlug) return;
    resolveShare(shareSlug)
      .then(setShareData)
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Invalid or expired share link');
      })
      .finally(() => setLoading(false));
  }, [shareSlug]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareData) return;

    if (!user) {
      if (!guestName.trim()) {
        toast.error('Name is required to start the test.');
        return;
      }
      if (!guestEmail.trim()) {
        toast.error('Email ID is required to start the test.');
        return;
      }
    }

    setStarting(true);
    try {
      const res = await startAttempt(shareData.test.id, {
        share_slug: shareSlug,
        guest_name: user ? undefined : guestName.trim(),
        guest_email: user ? undefined : guestEmail.trim(),
      });

      // Save attempt data in sessionStorage so the run page loads instantly
      sessionStorage.setItem(
        `attempt_${res.data.id}`,
        JSON.stringify({
          attempt: res.data,
          // @ts-ignore
          questions: res.data.test?.questions || [],
          answers: res.data.answers || [],
        })
      );

      router.push(`/take/${shareSlug}/run?attemptId=${res.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not start assessment';
      toast.error(msg);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading assessment details…</p>
        </div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090D16] p-4 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Unavailable Assessment</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          This test link is either expired, completed, or at maximum participant capacity.
        </p>
      </div>
    );
  }

  const { test } = shareData;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      {/* Top Navbar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <Logo size="md" showTagline={false} href={null} />
        <ThemeToggle />
      </div>

      <div className="card p-6 sm:p-8 max-w-xl w-full shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Proctored CBT Assessment
            </span>
            {test.negative_marking && (
              <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Negative Marking: -{test.negative_mark ?? 0.25}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {test.title}
          </h1>
          {test.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {test.description}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
              <p className="font-bold text-slate-900 dark:text-white">{test.duration_minutes} Mins</p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Questions</p>
              <p className="font-bold text-slate-900 dark:text-white">{test.question_count} Questions</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
            <CheckCircle2 className="h-4 w-4" /> Exam Instructions:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 ml-1">
            <li>The server countdown starts immediately when you click <strong>Start Test Now</strong>.</li>
            <li>Selecting an option does <strong>not</strong> auto-advance — click <strong>Save &amp; Next</strong>.</li>
            <li>Use the 5-state Question Palette to mark questions and review later.</li>
            <li>Detailed AI explanations &amp; short tricks will be available immediately after submission.</li>
          </ul>
        </div>

        {/* Guest or Logged in Candidate details */}
        <form onSubmit={handleStart} className="space-y-4">
          {!user ? (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Candidate Credentials
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter your details to generate your individualized scorecard
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    className="input pl-9"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="e.g. alex@example.com"
                    className="input pl-9"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Logged in as {user.name}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">{user.email}</p>
                </div>
              </div>
              <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px] font-bold">
                Verified
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={starting}
            className="btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            {starting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Initializing Assessment Session…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Start Test Now
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
