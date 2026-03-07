"use client";

import Link from "next/link";
import { CameraResetButton } from "@/app/_components/camera-reset-button";

interface ViewerHeaderProps {
  onResetCamera?: () => void;
}

export function ViewerHeader({ onResetCamera }: ViewerHeaderProps) {
  return (
    <header className="absolute top-6 left-6 z-40 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
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

        {/* 相机复位按钮 */}
        {onResetCamera && (
          <button
            onClick={onResetCamera}
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="relative z-10">相机复位</span>
          </button>
        )}
      </div>
    </header>
  );
}
