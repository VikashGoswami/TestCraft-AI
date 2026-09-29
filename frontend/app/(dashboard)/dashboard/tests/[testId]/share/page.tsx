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

  if (loading) return <div className="p-8">Loading shares…</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tests" className="btn-secondary p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Share &amp; Track Test</h1>
          <p className="text-sm text-gray-500">{test?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Link Card */}
        <div className="card p-6 h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Generate New Link
          </h2>
          <form onSubmit={handleCreateShare} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Label (Optional)</label>
              <input
                className="input"
                placeholder="e.g. Batch A, Math Club"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
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
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-500" />
            Active Links ({shares.length})
          </h2>

          {shares.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No share links generated yet. Create one using the form on the left!
            </div>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <div key={share.id} className="card p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {share.label || 'Default Share Link'}
                      </h3>
                      <p className="text-xs text-gray-400">Created: {new Date(share.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(share.url)}
                        className="btn-secondary text-xs flex items-center gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy URL
                      </button>
                    </div>
                  </div>

                  {/* Counters */}
                  <ShareCounters share={share} />

                  {/* QR Code and URL footer */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded truncate max-w-sm">
                      {share.url}
                    </div>
                    <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
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

