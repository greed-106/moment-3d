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
      className="p-2 rounded-full bg-white/60 backdrop-blur-sm border border-stone-200/50 shadow-md hover:bg-white/80 hover:shadow-lg transition-all"
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
      <svg
        className="w-5 h-5 text-stone-600"
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
