'use client';

import React from 'react';
import { useTheme } from '@/lib/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/60 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-95 ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={`h-4 w-4 transition-all duration-300 transform ${
            isDark
              ? 'scale-0 -rotate-90 opacity-0 absolute'
              : 'scale-100 rotate-0 opacity-100 text-amber-500'
          }`}
        />
        <Moon
          className={`h-4 w-4 transition-all duration-300 transform ${
            isDark
              ? 'scale-100 rotate-0 opacity-100 text-indigo-400'
              : 'scale-0 rotate-90 opacity-0 absolute'
          }`}
        />
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}
