'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import navConfig, { type NavSection } from './navConfig';

export function useRoleNav(): NavSection[] {
  const { user } = useAuth();
  if (!user || !user.roles?.length) return [];
  const role = user.roles[0];
  return navConfig[role] ?? navConfig['individual'];
}

