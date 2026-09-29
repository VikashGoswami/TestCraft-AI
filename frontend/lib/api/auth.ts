import client from './client';
import type { User } from '@/lib/types';

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}

export async function login(payload: LoginPayload): Promise<{ user: User; token?: string }> {
  const res = await client.post('/auth/login', payload);
  if (res.data?.token && typeof window !== 'undefined') {
    localStorage.setItem('auth_token', res.data.token);
  }
  return res.data;
}

export async function register(payload: RegisterPayload): Promise<{ user: User; token?: string }> {
  const res = await client.post('/auth/register', payload);
  if (res.data?.token && typeof window !== 'undefined') {
    localStorage.setItem('auth_token', res.data.token);
  }
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await client.post('/auth/logout');
  } catch (err) {
    console.warn('Logout request completed with error or already expired:', err);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
}

export async function me(): Promise<{ user: User }> {
  const res = await client.get('/auth/me');
  return res.data;
}

export async function googleTokenSignIn(
  idToken: string,
): Promise<{ user: User; is_new: boolean; token?: string }> {
  const res = await client.post('/auth/google/token-signin', { id_token: idToken });
  if (res.data?.token && typeof window !== 'undefined') {
    localStorage.setItem('auth_token', res.data.token);
  }
  return res.data;
}

