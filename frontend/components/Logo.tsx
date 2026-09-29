'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  iconOnly?: boolean;
  href?: string | null;
  className?: string;
}

export function LogoIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Document Body */}
      <path
        d="M12 4 C12 1.79 13.79 0 16 0 L68 0 L96 28 L96 112 C96 118.63 90.63 124 84 124 L24 124 C17.37 124 12 118.63 12 112 Z"
        fill="#4F46E5"
      />
      {/* Folded Corner Flap */}
      <path
        d="M68 0 L68 20 C68 24.42 71.58 28 76 28 L96 28 Z"
        fill="#818CF8"
      />
      {/* White Checkmark */}
      <path
        d="M30 64 L46 80 L78 44"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Emerald Badge with Sparkle */}
      <circle cx="92" cy="116" r="26" fill="#0D9488" />
      {/* Sparkle Star */}
      <path
        d="M92 98 Q92 116 74 116 Q92 116 92 134 Q92 116 110 116 Q92 116 92 98 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export default function Logo({
  size = 'md',
  showTagline = false,
  iconOnly = false,
  href = '/dashboard',
  className = '',
}: LogoProps) {
  const sizeConfig = {
    sm: {
      icon: 'h-6 w-6',
      title: 'text-base font-bold tracking-tight',
      tagline: 'text-[9px] tracking-wider',
      gap: 'gap-2',
    },
    md: {
      icon: 'h-8 w-8',
      title: 'text-xl font-extrabold tracking-tight',
      tagline: 'text-[10px] tracking-wider',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 'h-10 w-10',
      title: 'text-2xl font-black tracking-tight',
      tagline: 'text-xs tracking-wider',
      gap: 'gap-3',
    },
    xl: {
      icon: 'h-12 w-12',
      title: 'text-3xl font-black tracking-tight',
      tagline: 'text-xs tracking-widest',
      gap: 'gap-3.5',
    },
  }[size];

  const content = (
    <div className={`flex items-center ${sizeConfig.gap} ${className} group select-none`}>
      <div className="relative flex-shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-sm">
        <LogoIcon className={sizeConfig.icon} />
      </div>

      {!iconOnly && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`${sizeConfig.title} flex items-center`}>
            <span className="text-slate-900 dark:text-white transition-colors">Test</span>
            <span className="text-indigo-600 dark:text-indigo-400 transition-colors">Craft</span>
            <span className="text-teal-600 dark:text-teal-400 transition-colors">-AI</span>
          </div>
          {showTagline && (
            <span className={`text-slate-500 dark:text-slate-400 font-medium uppercase mt-0.5 ${sizeConfig.tagline}`}>
              Digitize. Proctor. Master.
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
