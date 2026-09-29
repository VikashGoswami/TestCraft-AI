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
  ChevronDown,
  Send,
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
const ACCEPT_LABEL = 'PDF, DOCX, JPG, PNG, TXT — max 20 MB';

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
    if (!file) { toast.error('Please select a file first.'); return; }

    setExtracting(true);
    setElapsedSeconds(0);
    setQuestions([]);

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
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
          msg = 'Server connection failed (ERR_EMPTY_RESPONSE). Please verify backend is running on port 8000.';
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
    setQuestions(prev => prev.map(q => q.id === editDraft.id ? editDraft : q));
    setEditingId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addBlankRow = () => {
    const blank = BLANK_QUESTION();
    setQuestions(prev => [...prev, blank]);
    startEdit(blank);
  };

  // ─── CSV Export ──────────────────────────────────────────────────────────────
  const exportCsv = () => {
    if (questions.length === 0) { toast.error('No questions to export.'); return; }

    const headers = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'topic', 'difficulty', 'marks'];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = questions.map(q =>
      [q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.topic, q.difficulty, q.marks]
        .map(escape).join(',')
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
  const diffBadge = (d: string) => ({
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  }[d] ?? 'bg-gray-100 text-gray-700');

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-100 rounded-xl">
          <ScanText className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Paper Import</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload any question paper — Gemini AI extracts all MCQs automatically
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900">Step 1 — Upload Question Paper</h2>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
            dragging ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/40'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={onFileChange} />
          <div className="p-3 bg-purple-100 rounded-full">
            <Upload className="h-6 w-6 text-purple-600" />
          </div>
          {file ? (
            <div className="text-center">
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                {file.type.startsWith('image/') ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB — click to change</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Drag & drop or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">{ACCEPT_LABEL}</p>
            </div>
          )}
        </div>

        {/* Context Hint */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Context Hint <span className="text-gray-400 font-normal">(optional — helps AI extract more accurately)</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder='e.g. "Class 12 Physics, CBSE board exam" or "100 MCQ questions, answer key on last page"'
            value={context}
            onChange={e => setContext(e.target.value)}
          />
        </div>

        {/* Extract Button */}
        <button
          onClick={handleExtract}
          disabled={!file || extracting}
          className="btn-primary flex items-center gap-2 py-3 px-6 disabled:opacity-60"
        >
          {extracting ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Gemini is reading your paper…</>
          ) : (
            <><ScanText className="h-4 w-4" /> Extract Questions</>
          )}
        </button>

        {extracting && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 space-y-1.5 animate-pulse">
            <p className="font-bold flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-600" />
              Processing with Gemini AI... ({elapsedSeconds}s elapsed)
            </p>
            <p className="text-purple-600">
              Reading all pages, detecting tables, extracting questions, options, and answers. Multi-page papers take ~30–75 seconds. Please do not refresh.
            </p>
          </div>
        )}
      </div>

      {/* Results Table */}
      {questions.length > 0 && (
        <div className="card p-6 space-y-4">

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Step 2 — Review & Edit Extracted Questions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                From: <span className="font-medium">{fileName}</span> ·{' '}
                <span className="text-green-700 font-medium">{questions.length} questions extracted</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={addBlankRow} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
              <button onClick={exportCsv} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Please review all extracted questions before exporting. AI may occasionally misread options or mark the wrong correct answer.
              Click the <strong>pencil icon</strong> on any row to edit. When satisfied, click <strong>Export CSV</strong> and upload it to your test via Bulk Upload.
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-8">#</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[220px]">Question</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[100px]">Option A</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[100px]">Option B</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[100px]">Option C</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 min-w-[100px]">Option D</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-20">Correct</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-24">Topic</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-20">Difficulty</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-14">Marks</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map((q, idx) => {
                  const isEditing = editingId === q.id;
                  const d = isEditing ? editDraft! : q;

                  return (
                    <tr key={q.id} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-2 text-gray-400 font-medium">{idx + 1}</td>

                      {/* Question Text */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <textarea
                            className="input text-xs min-h-[60px] w-full"
                            value={editDraft!.question_text}
                            onChange={e => setEditDraft(p => p ? { ...p, question_text: e.target.value } : p)}
                          />
                        ) : (
                          <p className="line-clamp-3">{q.question_text}</p>
                        )}
                      </td>

                      {/* Options A-D */}
                      {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map(opt => (
                        <td key={opt} className="px-3 py-2">
                          {isEditing ? (
                            <input
                              className="input text-xs w-full"
                              value={editDraft![opt]}
                              onChange={e => setEditDraft(p => p ? { ...p, [opt]: e.target.value } : p)}
                            />
                          ) : (
                            <span className={`${q.correct_option === opt.slice(-1) ? 'font-bold text-green-700' : 'text-gray-700'}`}>
                              {q[opt]}
                            </span>
                          )}
                        </td>
                      ))}

                      {/* Correct Option */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <select
                            className="input text-xs"
                            value={editDraft!.correct_option}
                            onChange={e => setEditDraft(p => p ? { ...p, correct_option: e.target.value as any } : p)}
                          >
                            {['a', 'b', 'c', 'd'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                          </select>
                        ) : (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 font-bold uppercase text-[11px]">
                            {q.correct_option}
                          </span>
                        )}
                      </td>

                      {/* Topic */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input className="input text-xs w-full" value={editDraft!.topic} onChange={e => setEditDraft(p => p ? { ...p, topic: e.target.value } : p)} />
                        ) : (
                          <span className="text-gray-700 truncate block max-w-[80px]" title={q.topic}>{q.topic}</span>
                        )}
                      </td>

                      {/* Difficulty */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <select className="input text-xs" value={editDraft!.difficulty} onChange={e => setEditDraft(p => p ? { ...p, difficulty: e.target.value as any } : p)}>
                            {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : (
                          <span className={`badge text-[10px] capitalize ${diffBadge(q.difficulty)}`}>{q.difficulty}</span>
                        )}
                      </td>

                      {/* Marks */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input type="number" min="0.5" step="0.5" className="input text-xs w-16" value={editDraft!.marks} onChange={e => setEditDraft(p => p ? { ...p, marks: parseFloat(e.target.value) } : p)} />
                        ) : (
                          <span className="text-gray-700">{q.marks}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Save">
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancel">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(q)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteQuestion(q.id)} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Delete">
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
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {questions.length} questions ready · Review complete? Export CSV and upload to your test.
            </p>
            <div className="flex gap-2">
              <button onClick={addBlankRow} className="btn-secondary flex items-center gap-1.5 text-sm">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
              <button onClick={exportCsv} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to use guide */}
      {questions.length === 0 && !extracting && (
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">How It Works</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            {[
              { step: '1', text: 'Upload your question paper — PDF, scanned image, Word doc, or plain text.' },
              { step: '2', text: 'Optionally add a context hint like "Class 10 Science CBSE" to improve accuracy.' },
              { step: '3', text: 'Gemini 1.5 Flash (free, 1 million token context) reads the entire paper and extracts all MCQs.' },
              { step: '4', text: 'Review extracted questions in the table — edit, delete, or add rows as needed.' },
              { step: '5', text: 'Export as CSV, then upload it to any test via Questions → Bulk Upload.' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">{step}</span>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-xs text-green-800 font-semibold">✅ Completely Free</p>
            <p className="text-xs text-green-700 mt-0.5">
              Uses Google Gemini 1.5 Flash API — free tier supports up to 1,500 requests/day with a 1 million token context window. No limits for normal use.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
