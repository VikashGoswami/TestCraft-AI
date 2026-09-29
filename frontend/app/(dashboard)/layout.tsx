'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRoleNav } from '@/lib/nav/useRoleNav';
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

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore
    } finally {
      toast.success('Logged out');
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = user.roles?.[0]?.replace(/_/g, ' ') ?? 'User';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="font-bold text-blue-600 text-lg tracking-tight">MCQ Platform</h1>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{roleLabel}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {navSections.map(section => (
            <div key={section.section}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
                {section.section}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = ICON_MAP[item.icon];
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 p-2 rounded-lg">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — offset for fixed sidebar */}
      <main className="flex-1 ml-64 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}

