"use client";

interface TutorialButtonProps {
  onClick: () => void;
  className?: string;
}

export function TutorialButton({
  onClick,
  className = "",
}: TutorialButtonProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={`relative overflow-hidden bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-800 px-4 py-2 rounded-xl transition-all font-medium shadow-[0_12px_40px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] flex items-center gap-2 pointer-events-auto active:scale-[0.98] ${className}`}
      >
        {/* 顶部高光边缘 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent z-10" />

        {/* 背景质感渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-stone-50/30 pointer-events-none rounded-xl" />

        <span className="relative z-10">🎮</span>
        <span className="relative z-10">交互教程</span>
      </button>

      {/* 底部环境光投影 */}
      <div className="absolute -bottom-2 left-[15%] w-[70%] h-4 bg-stone-900/5 blur-xl -z-10 pointer-events-none" />
    </div>
  );
}