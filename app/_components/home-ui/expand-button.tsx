"use client";

import { motion } from "framer-motion";

interface ExpandButtonProps {
  onClick: () => void;
}

export function ExpandButton({ onClick }: ExpandButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative p-2 rounded-full bg-white border border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition-all overflow-hidden"
      aria-label="展开面板"
      animate={{
        opacity: [0.85, 1, 0.85],
        y: [0, 3, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      whileHover={{ scale: 1.1, opacity: 1 }}
    >
      {/* 顶部高光 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      
      <svg
        className="w-5 h-5 text-stone-600 relative"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </motion.button>
  );
}
