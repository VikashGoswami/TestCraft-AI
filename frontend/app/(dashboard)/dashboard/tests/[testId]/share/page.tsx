'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTest } from '@/lib/api/tests';
import { listShares, createShare } from '@/lib/api/shares';
import type { Test, TestShare } from '@/lib/types';
import ShareCounters from '@/components/dashboard/ShareCounters';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Share2, Plus } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function SharePage() {
  const { testId } = useParams() as { testId: string };
  const [test, setTest] = useState<Test | null>(null);
  const [shares, setShares] = useState<TestShare[]>([]);
  const [loading, setLoading] = useState(true);

  // New Share Form
  const [label, setLabel] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [testRes, sharesRes] = await Promise.all([
        getTest(Number(testId)),
        listShares(Number(testId)),
      ]);
      setTest((testRes as any)?.data ?? testRes);
      const list = (sharesRes as any)?.data ?? sharesRes;
      setShares(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load share data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [testId]);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createShare(Number(testId), {
        label: label.trim() || undefined,
        max_participants: maxParticipants ? Number(maxParticipants) : undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      toast.success('Share link generated!');
      setLabel('');
      setMaxParticipants('');
      setExpiresAt('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to create share');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading shares…</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tests" className="btn-secondary p-2.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Share &amp; Track Test</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{test?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Link Card */}
        <div className="card p-6 h-fit space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Generate New Link
          </h2>
          <form onSubmit={handleCreateShare} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link Label (Optional)</label>
              <input
                className="input"
                placeholder="e.g. Batch A, Math Olympiad"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Participants</label>
              <input
                type="number"
                min="1"
                className="input"
                placeholder="Leave blank for unlimited"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expires At</label>
              <input
                type="datetime-local"
                className="input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Generating…' : 'Generate Link'}
            </button>
          </form>
        </div>

        {/* Existing Shares List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-5 w-5 text-slate-400" />
            Active Links ({shares.length})
          </h2>

          {shares.length === 0 ? (
            <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
              No share links generated yet. Create one using the form on the left!
            </div>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <div key={share.id} className="card p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {share.label || 'Default Share Link'}
                      </h3>
                      <p className="text-xs text-slate-400">Created: {new Date(share.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(share.url)}
                        className="btn-secondary text-xs flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5 text-indigo-500" />
                        Copy URL
                      </button>
                    </div>
                  </div>

                  {/* Counters */}
                  <ShareCounters share={share} />

                  {/* QR Code and URL footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 truncate w-full sm:max-w-sm">
                      {share.url}
                    </div>
                    <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm flex-shrink-0">
                      <QRCodeSVG value={share.url} size={64} />
                    </div>
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
