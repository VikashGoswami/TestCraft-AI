import client from './client';
import type { TestShare } from '@/lib/types';

export async function createShare(
  testId: number,
  payload: { label?: string; max_participants?: number; expires_at?: string },
): Promise<{ data: TestShare }> {
  const res = await client.post(`/tests/${testId}/shares`, payload);
  return res.data;
}

export async function listShares(testId: number): Promise<{ data: TestShare[] }> {
  const res = await client.get(`/tests/${testId}/shares`);
  return res.data;
}

