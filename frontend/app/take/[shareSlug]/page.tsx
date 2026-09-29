'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resolveShare, startAttempt } from '@/lib/api/attempts';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { Clock, HelpCircle, CheckCircle2, ShieldAlert, User, Mail } from 'lucide-react';

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
        toast.error('Name is required to start the test without login.');
        return;
      }
      if (!guestEmail.trim()) {
        toast.error('Email ID is required to start the test without login.');
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
        }),
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Unavailable Assessment</h1>
        <p className="text-sm text-gray-500 mt-1">This link is either expired or at capacity limit.</p>
      </div>
    );
  }

  const { test } = shareData;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-xl w-full shadow-lg space-y-6">
        <div>
          <span className="badge bg-blue-100 text-blue-700 mb-2">Ready to Start</span>
          <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
          {test.description && <p className="text-sm text-gray-600 mt-2">{test.description}</p>}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-bold text-gray-900">{test.duration_minutes} Minutes</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Questions</p>
              <p className="font-bold text-gray-900">{test.question_count} Questions</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-blue-600" /> Rules &amp; Instructions:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 ml-1">
            <li>The server countdown begins immediately upon clicking <strong>Start Test</strong>.</li>
            <li>Selecting an option does <strong>not</strong> auto-advance — click <strong>Save &amp; Next</strong>.</li>
            <li>You can mark questions to revisit via the palette before submitting.</li>
            <li>Your answers are automatically saved as you click through.</li>
          </ul>
        </div>

        {/* Guest Credentials (if not logged in) or Logged In Status */}
        <form onSubmit={handleStart} className="space-y-4">
          {!user ? (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Candidate Information</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Name and email ID are required when taking test without login.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    className="input pl-9"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    className="input pl-9"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-900">Signed in as {user.name}</p>
                <p className="text-xs text-green-700 mt-0.5">{user.email}</p>
              </div>
              <span className="badge bg-green-200 text-green-800 text-[10px] font-semibold">Logged In</span>
            </div>
          )}

          <button
            type="submit"
            disabled={starting}
            className="btn-primary w-full py-3.5 text-base font-bold shadow-sm"
          >
            {starting ? 'Initializing Session…' : 'Start Test Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
