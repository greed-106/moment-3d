"use client";

interface TutorialButtonProps {
  onClick: () => void;
  className?: string;
}

export function TutorialButton({ onClick, className = "" }: TutorialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white/70 backdrop-blur-xl hover:bg-white/80 border border-white/40 text-stone-700 hover:text-stone-800 px-4 py-2 rounded-xl transition-colors font-medium shadow-2xl shadow-stone-900/10 flex items-center gap-2 pointer-events-auto ${className}`}
    >
      <span>🎮</span>
      交互教程
    </button>
  );
}