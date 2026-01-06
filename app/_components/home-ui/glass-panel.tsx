"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassPanelProps {
  onCollapse: () => void;
  children: ReactNode;
  slideDirection?: "up" | "down";
}

export function GlassPanel({ onCollapse, children, slideDirection = "up" }: GlassPanelProps) {
  const isFromBottom = slideDirection === "up";

  return (
    <motion.div
      className="w-full max-w-md mx-4"
      initial={{ opacity: 0, y: isFromBottom ? 50 : -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isFromBottom ? 50 : -50 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="relative p-6 md:p-8 pt-1 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-stone-900/10">
        {/* 收起按钮 - 顶部居中 */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCollapse}
            className="p-1.5 rounded-full hover:bg-stone-200/50 transition-colors group"
            aria-label="收起面板"
          >
            <svg
              className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </motion.div>
  );
}
