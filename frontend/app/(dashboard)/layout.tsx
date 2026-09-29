'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRoleNav } from '@/lib/nav/useRoleNav';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users2,
  GraduationCap,
  BarChart2,
  TrendingUp,
  Settings,
  LogOut,
  Building2,
  ScanText,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users2,
  GraduationCap,
  BarChart2,
  TrendingUp,
  Settings,
  LogOut,
  Building2,
  ScanText,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const navSections = useRoleNav();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore
    } finally {
      toast.success('Logged out successfully');
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading TestCraft-AI…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleKey = user.roles?.[0] ?? 'individual';
  const roleLabel = roleKey.replace(/_/g, ' ');

  const ROLE_BADGE_STYLE: Record<string, string> = {
    individual: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    teacher: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    institution_admin: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    student: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <Logo size="sm" showTagline={false} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-white dark:bg-[#0c1220] border-r border-slate-200 dark:border-slate-800 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <Logo size="md" showTagline={true} />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Role Tag & AI Quick Action */}
        <div className="px-4 pt-3.5 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                ROLE_BADGE_STYLE[roleKey] ?? ROLE_BADGE_STYLE.individual
              }`}
            >
              {roleLabel}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          {/* Quick AI Paper Digitizer CTA button */}
          <Link
            href="/dashboard/question-paper"
            className="group relative flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-indigo-600/10 via-teal-500/10 to-indigo-600/10 dark:from-indigo-950/50 dark:to-teal-950/50 border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  AI Paper Import
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Scan PDF/Images to Quiz
                </p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {navSections.map((section) => (
            <div key={section.section}>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2.5 mb-1.5">
                {section.section}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {Icon && (
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                            }`}
                          />
                        )}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: Theme Toggle & User Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
          {/* Quick theme switch row */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Appearance
            </span>
            <ThemeToggle />
          </div>

          {/* User profile capsule */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
