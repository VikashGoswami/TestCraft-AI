'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTest, createQuestion, deleteQuestion, bulkUploadQuestions } from '@/lib/api/tests';
import { startAttempt } from '@/lib/api/attempts';
import type { Test, Question } from '@/lib/types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, ArrowLeft, Download, Play } from 'lucide-react';
import Link from 'next/link';

export default function QuestionsPage() {
  const { testId } = useParams() as { testId: string };
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [questionText, setQuestionText] = useState('');
  const [topic, setTopic] = useState('General');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [marks, setMarks] = useState<number>(1);
  const [options, setOptions] = useState([
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ]);
  const [saving, setSaving] = useState(false);

  // Bulk Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await getTest(Number(testId));
      const testData = (res as any)?.data ?? res;
      setTest(testData);
      setQuestions(testData?.questions || []);
    } catch {
      toast.error('Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setSaving(true);
    try {
      await createQuestion(Number(testId), {
        question_text: questionText,
        topic,
        difficulty,
        marks,
        options,
      });
      toast.success('Question added');
      setQuestionText('');
      setOptions([
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ]);
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion(Number(testId), questionId);
      toast.success('Question deleted');
      fetchQuestions();
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const res = await bulkUploadQuestions(Number(testId), file);
      toast.success(`Imported ${res.imported} questions successfully!`);
      if (res.errors?.length) {
        toast.error(`Encountered ${res.errors.length} errors during upload`);
      }
      setFile(null);
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const [startingTest, setStartingTest] = useState(false);

  const handleStartTestNow = async () => {
    if (questions.length === 0) {
      toast.error('Please add at least one question before starting the test.');
      return;
    }
    setStartingTest(true);
    try {
      const res = await startAttempt(Number(testId), {});
      sessionStorage.setItem(
        `attempt_${res.data.id}`,
        JSON.stringify({
          attempt: res.data,
          questions: res.data.test?.questions || questions,
          answers: res.data.answers || [],
        }),
      );
      router.push(`/take/direct/run?attemptId=${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start test');
    } finally {
      setStartingTest(false);
    }
  };

  if (loading) return <div className="p-8">Loading questions…</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tests" className="btn-secondary p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Questions</h1>
            <p className="text-sm text-gray-500">{test?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartTestNow}
            disabled={startingTest}
            className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm font-medium"
            title="Start and test this assessment now"
          >
            <Play className="h-4 w-4 text-green-600" />
            {startingTest ? 'Starting…' : 'Start Test Now'}
          </button>
          <Link href={`/dashboard/tests/${testId}/share`} className="btn-primary">
            Share Test
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Question Builder & Bulk Upload */}
        <div className="lg:col-span-2 space-y-8">
          {/* Add Question Form */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add Single Question
            </h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="e.g. What is the value of x if 2x + 5 = 15?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    className="input"
                    placeholder="e.g. Algebra"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    className="input"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input
                    className="input"
                    type="number"
                    min={0.5}
                    step={0.5}
                    max={100}
                    value={marks}
                    onChange={(e) => setMarks(parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-gray-700">Options (Select correct one)</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.is_correct}
                      onChange={() => {
                        setOptions(
                          options.map((o, i) => ({
                            ...o,
                            is_correct: i === idx,
                          })),
                        );
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      className="input flex-1"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt.option_text}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx].option_text = e.target.value;
                        setOptions(newOpts);
                      }}
                      required
                    />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full mt-4">
                {saving ? 'Saving…' : 'Add Question'}
              </button>
            </form>
          </div>

          {/* Bulk Upload Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-600" />
                Bulk Upload Questions
              </h2>
              <a
                href="/sample_questions.csv"
                download="sample_questions.csv"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample CSV
              </a>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Upload a <code>.csv</code> or <code>.xlsx</code> file containing columns:{' '}
              <code>question_text, option_a, option_b, option_c, option_d, correct_option, marks, topic, difficulty</code>
              <br />
              <span className="text-xs text-gray-400">marks defaults to 1 if omitted.</span>
            </p>
            <form onSubmit={handleBulkUpload} className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button type="submit" disabled={uploading || !file} className="btn-primary whitespace-nowrap">
                {uploading ? 'Uploading…' : 'Upload File'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Existing Questions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Questions ({questions.length})</h2>
          </div>

          {questions.length === 0 ? (
            <div className="card p-6 text-center text-gray-500 text-sm">
              No questions added yet. Add one using the form or bulk upload!
            </div>
          ) : (
            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={q.id} className="card p-4 space-y-2 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-blue-600">Q{idx + 1}</span>
                    <span className="badge bg-gray-100 text-gray-600 text-[10px]">{q.topic}</span>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{q.options?.length || 0} options</span>
                    <span className="font-medium text-blue-600">{q.marks ?? 1} mark{(q.marks ?? 1) !== 1 ? 's' : ''}</span>
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

