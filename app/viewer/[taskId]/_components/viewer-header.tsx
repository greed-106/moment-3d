"use client";

import Link from "next/link";

export function ViewerHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between pointer-events-none z-10">
      <Link
        href="/"
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-800 transition-all shadow-[0_12px_40px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] active:scale-[0.98]"
      >
        {/* 顶部高光边缘 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        
        {/* 背景质感渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-stone-50/30 pointer-events-none rounded-xl" />
        
        <svg
          className="w-5 h-5 relative z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="relative z-10">返回</span>
      </Link>
    </header>
  );
}