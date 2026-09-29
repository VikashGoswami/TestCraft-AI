import client from './client';
import type { Test, Question, Option, Paginated } from '@/lib/types';

export async function listTests(params?: Record<string, string | number>): Promise<Paginated<Test>> {
  const res = await client.get('/tests', { params });
  return res.data;
}

export async function getTest(testId: number): Promise<{ data: Test }> {
  const res = await client.get(`/tests/${testId}`);
  return res.data;
}

export async function createTest(payload: Partial<Test>): Promise<{ data: Test }> {
  const res = await client.post('/tests', payload);
  return res.data;
}

export async function updateTest(testId: number, payload: Partial<Test>): Promise<{ data: Test }> {
  const res = await client.patch(`/tests/${testId}`, payload);
  return res.data;
}

export async function deleteTest(testId: number): Promise<void> {
  await client.delete(`/tests/${testId}`);
}

export async function createQuestion(
  testId: number,
  payload: { question_text: string; topic?: string; difficulty?: string; marks?: number; options: { option_text: string; is_correct: boolean }[] },
): Promise<Question> {
  const res = await client.post(`/tests/${testId}/questions`, payload);
  return res.data;
}

export async function updateQuestion(
  testId: number,
  questionId: number,
  payload: Partial<Question> & { options: { option_text: string; is_correct: boolean }[] },
): Promise<Question> {
  const res = await client.patch(`/tests/${testId}/questions/${questionId}`, payload);
  return res.data;
}

export async function deleteQuestion(testId: number, questionId: number): Promise<void> {
  await client.delete(`/tests/${testId}/questions/${questionId}`);
}

export async function bulkUploadQuestions(
  testId: number,
  file: File,
): Promise<{ imported: number; errors: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post(`/tests/${testId}/questions/bulk-upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function saveTheme(
  testId: number,
  payload: { template_key: string; primary_color?: string; accent_color?: string; layout_config?: Record<string, unknown> },
): Promise<void> {
  await client.post(`/tests/${testId}/theme`, payload);
}

export async function getTestAttempts(testId: number, params?: Record<string, string | number>) {
  const res = await client.get(`/tests/${testId}/attempts`, { params });
  return res.data;
}

