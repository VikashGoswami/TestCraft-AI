import client from './client';
import type { Attempt, AttemptAnswer, AttemptReport, QuestionState } from '@/lib/types';

export async function resolveShare(slug: string) {
  const res = await client.get(`/shares/${slug}`);
  return res.data as { share: import('@/lib/types').TestShare; test: { id: number; title: string; description: string | null; duration_minutes: number; question_count: number; creator: string } };
}

export async function startAttempt(
  testId: number,
  payload: { share_slug?: string; guest_name?: string; guest_email?: string },
): Promise<{ data: Attempt }> {
  const res = await client.post(`/tests/${testId}/attempts`, payload);
  return res.data;
}

export async function getAttempt(attemptId: number): Promise<{ data: Attempt }> {
  const res = await client.get(`/attempts/${attemptId}`);
  return res.data;
}

export async function updateAnswer(
  attemptId: number,
  payload: { question_id: number; selected_option_id: number | null; action: 'visit' | 'save' | 'mark' | 'clear' },
): Promise<{ state: QuestionState; selected_option_id: number | null }> {
  const res = await client.patch(`/attempts/${attemptId}/answers`, payload);
  return res.data;
}

export async function submitAttempt(attemptId: number): Promise<{ data: Attempt }> {
  const res = await client.post(`/attempts/${attemptId}/submit`);
  return res.data;
}

export async function getReport(attemptId: number): Promise<AttemptReport | { generation_status: 'pending'; attempt_id: number; score: number | null }> {
  const res = await client.get(`/attempts/${attemptId}/report`);
  return res.data;
}

export interface ReviewOption {
  id: number;
  letter: string;
  option_text: string;
  is_correct: boolean;
  is_selected: boolean;
}

export interface ReviewQuestion {
  id: number;
  order_index: number;
  question_text: string;
  topic: string;
  difficulty: string;
  marks: number;
  status: 'correct' | 'wrong' | 'unattempted';
  marks_awarded: number;
  selected_option_id: number | null;
  selected_option_letter: string | null;
  correct_option_id: number | null;
  correct_option_letter: string | null;
  options: ReviewOption[];
  explanation: string;
  short_trick: string;
}

export interface AttemptReviewData {
  attempt_id: number;
  test_id: number;
  test_title: string;
  candidate_name: string;
  candidate_email: string;
  submitted_at: string | null;
  score: number;
  total_questions: number;
  attempted_questions: number;
  unattempted_questions: number;
  correct_questions: number;
  wrong_questions: number;
  total_earned_marks: number;
  total_possible_marks: number;
  has_negative_marking: boolean;
  negative_mark: number;
  questions: ReviewQuestion[];
}

export async function getAttemptReview(attemptId: number): Promise<AttemptReviewData> {
  const res = await client.get(`/attempts/${attemptId}/review`);
  return res.data;
}

export async function getQuestionAiExplanation(questionId: number): Promise<{ explanation: string; short_trick: string }> {
  const res = await client.post(`/questions/${questionId}/ai-explanation`);
  return res.data;
}

