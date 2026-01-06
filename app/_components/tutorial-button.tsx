"use client";

interface TutorialButtonProps {
  onClick: () => void;
  className?: string;
}

export function TutorialButton({ onClick, className = "" }: TutorialButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-sm hover:bg-white border border-stone-200/50 text-stone-700 hover:text-stone-800 px-4 py-2 rounded-lg transition-colors font-medium shadow-lg flex items-center gap-2 pointer-events-auto ${className}`}
    >
      <span>🎮</span>
      交互教程
    </button>
  );
}