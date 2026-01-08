"use client";

import Link from "next/link";
import { ModeToggle, type ViewMode } from "@/app/_components/mode-toggle";

interface ViewerHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewerHeader({ viewMode, onViewModeChange }: ViewerHeaderProps) {
  return (
    <header className="absolute top-6 left-6 z-40 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="relative flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/50 text-stone-700 hover:bg-white/80 hover:text-stone-800 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.12)] active:scale-[0.98] overflow-hidden"
        >
          {/* 顶部高光边缘 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          
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
          <span className="relative z-10">回到首页</span>
        </Link>

        {/* 模式切换按钮 */}
        <ModeToggle mode={viewMode} onModeChange={onViewModeChange} variant="glass" />
      </div>
    </header>
  );
}
