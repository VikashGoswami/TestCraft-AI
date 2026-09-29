'use client';

import { useState } from 'react';
import type { TestTheme, TemplateKey } from '@/lib/types';
import { saveTheme } from '@/lib/api/tests';
import toast from 'react-hot-toast';
import { Sparkles, Check, Eye, Palette } from 'lucide-react';

interface ThemeConfiguratorProps {
  testId: number;
  initialTheme?: TestTheme | null;
  onSaved?: () => void;
}

export default function ThemeConfigurator({
  testId,
  initialTheme,
  onSaved,
}: ThemeConfiguratorProps) {
  const [templateKey, setTemplateKey] = useState<TemplateKey>(
    initialTheme?.template_key ?? 'focused',
  );
  const [primaryColor, setPrimaryColor] = useState(
    initialTheme?.primary_color ?? '#4F46E5',
  );
  const [accentColor, setAccentColor] = useState(
    initialTheme?.accent_color ?? '#0D9488',
  );
  const [saving, setSaving] = useState(false);

  // Live preview state for interactive demo in builder
  const [previewSelectedOption, setPreviewSelectedOption] = useState<number>(1);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTheme(testId, {
        template_key: templateKey,
        primary_color: primaryColor,
        accent_color: accentColor,
        layout_config: {
          show_question_palette: true,
          free_navigation: true,
        },
      });
      toast.success('Theme applied to test successfully!');
      onSaved?.();
    } catch {
      toast.error('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
          1. Select Presentation Template
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template B: Focused Practice */}
          <div
            onClick={() => setTemplateKey('focused')}
            className={`card p-6 cursor-pointer border-2 transition-all relative ${
              templateKey === 'focused'
                ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {templateKey === 'focused' && (
              <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full shadow-sm">
                <Check className="h-4 w-4" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                Minimal
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Focused Practice (Template B)</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Distraction-free single card layout with sticky top timer pill, ideal for quizzes,
              standard prep, and timed sectionals.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Card Header → Timer Pill → Question Card → Palette Sidebar</span>
            </div>
          </div>

          {/* Template A: Corporate Assessment */}
          <div
            onClick={() => setTemplateKey('corporate')}
            className={`card p-6 cursor-pointer border-2 transition-all relative ${
              templateKey === 'corporate'
                ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {templateKey === 'corporate' && (
              <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full shadow-sm">
                <Check className="h-4 w-4" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold">
                High-Density
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Corporate Assessment (Template A)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Dense TCS iON style multi-panel layout with candidate profile bar, section tabs, meta
              marks strip, and grouped palette.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Top Navy Bar → Section Tabs → Meta Strip → Split Content</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Color Config */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          2. Theme Accent &amp; Branding Colors
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          These colors will theme the runner header, selected option highlights, and primary actions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Primary Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-12 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="input font-mono text-sm max-w-xs uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Secondary / Review Accent
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-12 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="input font-mono text-sm max-w-xs uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-500" />
            3. Interactive Live Runner Preview
          </h3>
          <span className="text-xs text-slate-400 capitalize">
            Rendering: {templateKey} Template
          </span>
        </div>

        {/* Live Preview Container */}
        <div
          className="test-runner rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner"
          data-template={templateKey}
        >
          {templateKey === 'corporate' ? (
            /* Corporate Template Preview */
            <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs">
              <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-2.5 flex items-center justify-between">
                <span className="font-bold">ASSESSMENT CONSOLE — SAMPLE MODULE</span>
                <span className="font-mono bg-indigo-950 px-2 py-0.5 rounded text-teal-300 font-semibold">
                  Time Left: 45:00
                </span>
              </div>
              <div className="bg-slate-200 dark:bg-slate-800 px-4 py-1.5 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <div className="flex gap-2">
                  <span className="bg-white dark:bg-slate-900 px-2 py-0.5 font-bold border-t-2 border-indigo-600 text-slate-900 dark:text-white">
                    Section 1: General
                  </span>
                </div>
                <span>Marks: +1.0 / -0.25</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Question 1: What is 2 + 2?</p>
                  <div className="space-y-1.5">
                    {[
                      { id: 1, text: 'A. 3' },
                      { id: 2, text: 'B. 4' },
                      { id: 3, text: 'C. 5' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPreviewSelectedOption(opt.id)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                          previewSelectedOption === opt.id
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-[11px] text-slate-600 dark:text-slate-400">PALETTE</p>
                  <div className="grid grid-cols-4 gap-1">
                    <span className="qpalette__tile h-6 rounded text-white flex items-center justify-center font-bold" data-state="answered">1</span>
                    <span className="qpalette__tile h-6 rounded text-white flex items-center justify-center font-bold" data-state="not-answered">2</span>
                    <span className="qpalette__tile h-6 rounded text-white flex items-center justify-center font-bold" data-state="marked">3</span>
                    <span className="qpalette__tile h-6 rounded text-white flex items-center justify-center font-bold" data-state="not-visited">4</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Focused Template Preview */
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Focused Quiz Header</span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs px-2.5 py-1 rounded-md font-semibold">
                  ⏱ 45:00
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="badge bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px]">Mathematics</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Question 1: What is the derivative of x²?
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: 1, text: 'A. 2x' },
                      { id: 2, text: 'B. x' },
                      { id: 3, text: 'C. 2' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPreviewSelectedOption(opt.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 text-xs transition-all ${
                          previewSelectedOption === opt.id
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Question Palette</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <span className="qpalette__tile h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs" data-state="answered">1</span>
                    <span className="qpalette__tile h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs" data-state="not-answered">2</span>
                    <span className="qpalette__tile h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs" data-state="marked">3</span>
                    <span className="qpalette__tile h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs" data-state="not-visited">4</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Action */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base font-bold shadow-md"
      >
        <Sparkles className="h-5 w-5" />
        {saving ? 'Applying Settings…' : 'Save & Apply Theme to Test'}
      </button>
    </div>
  );
}
