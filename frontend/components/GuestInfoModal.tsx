'use client';
import { useState, useRef, useEffect } from 'react';
import { User, Mail, X, Play } from 'lucide-react';

interface GuestInfoModalProps {
  testTitle?: string;
  onConfirm: (guestName: string, guestEmail: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function GuestInfoModal({
  testTitle,
  onConfirm,
  onClose,
  loading = false,
}: GuestInfoModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Your name is required to start the test.');
      nameRef.current?.focus();
      return;
    }
    setNameError('');
    onConfirm(name.trim(), email.trim());
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Before you begin…</h2>
            {testTitle && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{testTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You&apos;re not logged in. Please enter your details so your result can be recorded.
          </p>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                ref={nameRef}
                type="text"
                className={`input pl-9 ${nameError ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. John Doe"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                maxLength={100}
              />
            </div>
            {nameError && (
              <p className="mt-1 text-xs text-red-600">{nameError}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address{' '}
              <span className="text-gray-400 font-normal">(optional — for result delivery)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                className="input pl-9"
                placeholder="e.g. john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              <Play className="h-4 w-4" />
              {loading ? 'Starting…' : 'Start Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
