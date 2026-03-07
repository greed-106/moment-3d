"use client";

interface CameraResetButtonProps {
  onReset: () => void;
  variant?: "solid" | "glass";
}

export function CameraResetButton({ onReset, variant = "glass" }: CameraResetButtonProps) {
  const isGlass = variant === "glass";

  return (
    <button
      onClick={onReset}
      className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-[0.98] overflow-hidden ${
        isGlass
          ? "bg-white/70 backdrop-blur-md border border-white/50 text-stone-700 hover:bg-white/80 hover:text-stone-800 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-[0_12px_40px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)]"
      }`}
      title="复位相机"
    >
      {/* 顶部高光边缘 */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isGlass ? "via-white/60" : "via-white/90"} to-transparent`} />

      {/* 背景质感渐变（仅solid模式） */}
      {!isGlass && (
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-stone-50/30 pointer-events-none rounded-xl" />
      )}

      {/* 相机复位图标 - 圆形转圈箭头 */}
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
    </button>
  );
}
