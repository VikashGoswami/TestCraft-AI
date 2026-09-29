'use client';

import { useState, useRef, useCallback } from 'react';
import client from '@/lib/api/client';
import toast from 'react-hot-toast';
import {
  Upload,
  ScanText,
  Download,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Image,
  Pencil,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExtractedQuestion {
  id: string; // client-side only
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}

const BLANK_QUESTION = (): ExtractedQuestion => ({
  id: Math.random().toString(36).slice(2),
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  topic: 'General',
  difficulty: 'medium',
  marks: 1,
});

const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt';
const ACCEPT_LABEL = 'PDF, DOCX, JPG, PNG, TXT — max 50 MB';

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuestionPaperPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ExtractedQuestion | null>(null);
  const [fileName, setFileName] = useState('');

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  // ─── Upload & Extract ────────────────────────────────────────────────────────
  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select a file first.');
      return;
    }

    setExtracting(true);
    setElapsedSeconds(0);
    setQuestions([]);

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const form = new FormData();
    form.append('file', file);
    if (context.trim()) form.append('context', context.trim());

    try {
      const res = await client.post('/question-papers/extract', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300_000, // 5 minutes timeout for multi-page documents
      });

      const data = res.data;

      if (!data.success) {
        toast.error(data.message || 'Extraction failed.');
        return;
      }

      const extracted: ExtractedQuestion[] = (data.questions ?? []).map((q: any) => ({
        ...q,
        id: Math.random().toString(36).slice(2),
      }));

      setQuestions(extracted);
      setFileName(data.file_name ?? file.name);

      if (extracted.length === 0) {
        toast('No MCQ questions found in this file. Try adding a context hint.', { icon: '⚠️' });
      } else {
        toast.success(`Extracted ${extracted.length} questions!`);
      }
    } catch (err: any) {
      clearInterval(timer);
      let msg = err.response?.data?.message;
      if (!msg) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          msg = 'Extraction timed out. Multi-page papers may take longer. Please retry.';
        } else if (err.message === 'Network Error' || !err.response) {
          msg = 'Server connection failed (ERR_EMPTY_RESPONSE). Please verify backend is running.';
        } else {
          msg = 'Extraction failed. Check file and try again.';
        }
      }
      toast.error(msg);
    } finally {
      clearInterval(timer);
      setExtracting(false);
    }
  };

  // ─── Edit Inline ─────────────────────────────────────────────────────────────
  const startEdit = (q: ExtractedQuestion) => {
    setEditingId(q.id);
    setEditDraft({ ...q });
  };

  const saveEdit = () => {
    if (!editDraft) return;
    setQuestions((prev) => (prev.map((q) => (q.id === editDraft.id ? editDraft : q))));
    setEditingId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addBlankRow = () => {
    const blank = BLANK_QUESTION();
    setQuestions((prev) => [...prev, blank]);
    startEdit(blank);
  };

  // ─── CSV Export ──────────────────────────────────────────────────────────────
  const exportCsv = () => {
    if (questions.length === 0) {
      toast.error('No questions to export.');
      return;
    }

    const headers = [
      'question_text',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_option',
      'topic',
      'difficulty',
      'marks',
    ];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = questions.map((q) =>
      [
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_option,
        q.topic,
        q.difficulty,
        q.marks,
      ]
        .map(escape)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_questions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded! Upload it to any test via Bulk Upload.');
  };

  // ─── Difficulty badge ────────────────────────────────────────────────────────
  const diffBadge = (d: string) =>
    ({
      easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
      medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
      hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800',
    }[d] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700');

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm">
          <ScanText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI Paper Import
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Upload exam papers or question banks — Google Gemini AI extracts all questions, options & shortcuts automatically
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Step 1 — Upload Question Paper
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Zap className="h-3 w-3" />
            Gemini Multimodal Vision
          </span>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            dragging
              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={onFileChange}
          />
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/40">
            <Upload className="h-6 w-6" />
          </div>
          {file ? (
            <div className="text-center">
              <p className="font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                {file.type.startsWith('image/') ? (
                  <Image className="h-4 w-4 text-indigo-500" />
                ) : (
                  <FileText className="h-4 w-4 text-indigo-500" />
                )}
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB — click or drag to replace
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drag &amp; drop your paper here or click to browse
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{ACCEPT_LABEL}</p>
            </div>
          )}
        </div>

        {/* Context Hint */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Context Hint{' '}
            <span className="text-slate-400 font-normal lowercase">
              (optional — e.g. &quot;Class 12 Physics CBSE&quot; or &quot;Answer key on page 4&quot;)
            </span>
          </label>
          <input
            type="text"
            className="input"
            placeholder='e.g. "Physics exam, 50 questions with options A, B, C, D"'
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        {/* Extract Button */}
        <button
          onClick={handleExtract}
          disabled={!file || extracting}
          className="btn-primary flex items-center gap-2 py-3 px-6 text-sm font-semibold shadow-lg shadow-indigo-600/25"
        >
          {extracting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-teal-300" />
              <span>Gemini AI is reading your paper…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-teal-300" />
              <span>Extract Questions with AI</span>
            </>
          )}
        </button>

        {extracting && (
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5 animate-pulse">
            <p className="font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              Processing with Google Gemini AI... ({elapsedSeconds}s elapsed)
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Reading all pages, detecting formulas, isolating questions, matching options, and extracting solution keys. Multi-page papers take ~15–45 seconds. Please do not refresh.
            </p>
          </div>
        )}
      </div>

      {/* Results Table */}
      {questions.length > 0 && (
        <div className="card p-6 sm:p-8 space-y-5 border border-slate-200 dark:border-slate-800">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Step 2 — Review &amp; Edit Extracted Questions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                From: <span className="font-semibold text-slate-800 dark:text-slate-200">{fileName}</span> ·{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {questions.length} questions ready
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addBlankRow}
                className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Row</span>
              </button>
              <button
                onClick={exportCsv}
                className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 shadow-md shadow-indigo-600/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Review extracted questions below. Click the <strong>pencil icon</strong> on any row to edit fields inline. When satisfied, click <strong>Export CSV</strong> to save and import into your tests.
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <th className="text-left px-3 py-3 font-semibold w-8">#</th>
                  <th className="text-left px-3 py-3 font-semibold min-w-[220px]">Question</th>
                  <th className="text-left px-3 py-3 font-semibold min-w-[100px]">Option A</th>
                  <th className="text-left px-3 py-3 font-semibold min-w-[100px]">Option B</th>
                  <th className="text-left px-3 py-3 font-semibold min-w-[100px]">Option C</th>
                  <th className="text-left px-3 py-3 font-semibold min-w-[100px]">Option D</th>
                  <th className="text-left px-3 py-3 font-semibold w-20">Correct</th>
                  <th className="text-left px-3 py-3 font-semibold w-24">Topic</th>
                  <th className="text-left px-3 py-3 font-semibold w-20">Difficulty</th>
                  <th className="text-left px-3 py-3 font-semibold w-14">Marks</th>
                  <th className="text-center px-3 py-3 font-semibold w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {questions.map((q, idx) => {
                  const isEditing = editingId === q.id;

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isEditing ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-slate-400 font-medium">{idx + 1}</td>

                      {/* Question Text */}
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <textarea
                            className="input text-xs min-h-[60px] w-full"
                            value={editDraft!.question_text}
                            onChange={(e) =>
                              setEditDraft((p) => (p ? { ...p, question_text: e.target.value } : p))
                            }
                          />
                        ) : (
                          <p className="line-clamp-3 text-slate-900 dark:text-slate-100 font-medium">
                            {q.question_text}
                          </p>
                        )}
                      </td>

                      {/* Options A-D */}
                      {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((opt) => (
                        <td key={opt} className="px-3 py-2.5">
                          {isEditing ? (
                            <input
                              className="input text-xs w-full"
                              value={editDraft![opt]}
                              onChange={(e) =>
                                setEditDraft((p) => (p ? { ...p, [opt]: e.target.value } : p))
                              }
                            />
                          ) : (
                            <span
                              className={`${
                                q.correct_option === opt.slice(-1)
                                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {q[opt]}
                            </span>
                          )}
                        </td>
                      ))}

                      {/* Correct Option */}
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <select
                            className="input text-xs py-1"
                            value={editDraft!.correct_option}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, correct_option: e.target.value as any } : p
                              )
                            }
                          >
                            {['a', 'b', 'c', 'd'].map((l) => (
                              <option key={l} value={l}>
                                {l.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold uppercase text-[11px]">
                            {q.correct_option}
                          </span>
                        )}
                      </td>

                      {/* Topic */}
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <input
                            className="input text-xs w-full py-1"
                            value={editDraft!.topic}
                            onChange={(e) =>
                              setEditDraft((p) => (p ? { ...p, topic: e.target.value } : p))
                            }
                          />
                        ) : (
                          <span
                            className="text-slate-700 dark:text-slate-300 truncate block max-w-[80px]"
                            title={q.topic}
                          >
                            {q.topic}
                          </span>
                        )}
                      </td>

                      {/* Difficulty */}
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <select
                            className="input text-xs py-1"
                            value={editDraft!.difficulty}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, difficulty: e.target.value as any } : p
                              )
                            }
                          >
                            {['easy', 'medium', 'hard'].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`badge border text-[10px] capitalize ${diffBadge(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        )}
                      </td>

                      {/* Marks */}
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            className="input text-xs w-16 py-1"
                            value={editDraft!.marks}
                            onChange={(e) =>
                              setEditDraft((p) =>
                                p ? { ...p, marks: parseFloat(e.target.value) } : p
                              )
                            }
                          />
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{q.marks}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded"
                                title="Save"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(q)}
                                className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteQuestion(q.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {questions.length} questions ready · Export CSV and import into any TestCraft-AI assessment.
            </p>
            <div className="flex gap-2">
              <button
                onClick={addBlankRow}
                className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
              <button
                onClick={exportCsv}
                className="btn-primary flex items-center gap-2 text-xs py-2 px-4 shadow-md shadow-indigo-600/25"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to use guide */}
      {questions.length === 0 && !extracting && (
        <div className="card p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            How It Works
          </h2>
          <ol className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400">
            {[
              {
                step: '1',
                text: 'Upload your question paper — PDF, scanned image, Word doc, or plain text.',
              },
              {
                step: '2',
                text: 'Optionally add a context hint like "CBSE Class 12 Chemistry" to assist AI pattern recognition.',
              },
              {
                step: '3',
                text: 'Google Gemini 3.5 Flash processes the document, extracting questions, options, topics, and solutions.',
              },
              {
                step: '4',
                text: 'Review and refine questions in the interactive table — adjust keys, difficulty, or edit options.',
              },
              {
                step: '5',
                text: 'Export as CSV, then import it directly into any test via Test Builder → Bulk Upload.',
              },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  {step}
                </span>
                <p className="pt-0.5 leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl">
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              ⚡ Powered by Google Gemini AI
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
              Equipped with automatic model fallbacks (Gemini 3.5 Flash, 2.5 Flash-Lite, and 3.8 Flash) with support for large file streaming up to 50MB.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
