import type { UserRole } from '@/lib/types';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

const navConfig: Record<UserRole, NavSection[]> = {
  individual: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Tests', href: '/dashboard/tests', icon: 'FileText' },
        { label: 'Create Test', href: '/dashboard/tests/new', icon: 'PlusCircle' },
        { label: 'AI Paper Import', href: '/dashboard/question-paper', icon: 'ScanText' },
      ],
    },
    {
      section: 'Analytics',
      items: [
        { label: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart2' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { label: 'Profile', href: '/dashboard/settings', icon: 'Settings' },
      ],
    },
  ],

  institution_admin: [
    {
      section: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'All Tests', href: '/dashboard/tests', icon: 'FileText' },
        { label: 'All Classes', href: '/dashboard/classes', icon: 'Users2' },
        { label: 'AI Paper Import', href: '/dashboard/question-paper', icon: 'ScanText' },
      ],
    },
    {
      section: 'People',
      items: [
        { label: 'Teachers', href: '/dashboard/institution/teachers', icon: 'GraduationCap' },
      ],
    },
    {
      section: 'Analytics',
      items: [
        { label: 'Org Analytics', href: '/dashboard/analytics', icon: 'BarChart2' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { label: 'Institution Settings', href: '/dashboard/institution/settings', icon: 'Settings' },
      ],
    },
  ],

  teacher: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Tests', href: '/dashboard/tests', icon: 'FileText' },
        { label: 'Create Test', href: '/dashboard/tests/new', icon: 'PlusCircle' },
        { label: 'AI Paper Import', href: '/dashboard/question-paper', icon: 'ScanText' },
      ],
    },
    {
      section: 'Classes',
      items: [
        { label: 'My Classes', href: '/dashboard/classes', icon: 'Users2' },
      ],
    },
    {
      section: 'Analytics',
      items: [
        { label: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart2' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { label: 'Profile', href: '/dashboard/settings', icon: 'Settings' },
      ],
    },
  ],

  student: [
    {
      section: 'Main',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Tests', href: '/dashboard/tests', icon: 'FileText' },
        { label: 'My Class', href: '/dashboard/classes', icon: 'Users2' },
      ],
    },
    {
      section: 'Progress',
      items: [
        { label: 'My Progress', href: '/dashboard/analytics', icon: 'TrendingUp' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { label: 'Profile', href: '/dashboard/settings', icon: 'Settings' },
      ],
    },
  ],
};

export default navConfig;

