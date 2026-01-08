"use client";

export type ViewMode = "photo" | "roam";

interface ModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  variant?: "solid" | "glass";
}

export function ModeToggle({ mode, onModeChange, variant = "solid" }: ModeToggleProps) {
  const isGlass = variant === "glass";

  return (
    <div className="relative">
      <div
        className={`relative flex items-center rounded-xl p-1 overflow-hidden ${
          isGlass
            ? "bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            : "bg-white border border-stone-200 shadow-[0_12px_40px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)]"
        }`}
      >
        {/* 顶部高光边缘 */}
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isGlass ? "via-white/60" : "via-white/90"} to-transparent z-10`} />

        {/* 背景质感渐变（仅solid模式） */}
        {!isGlass && (
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-stone-50/30 pointer-events-none rounded-xl" />
        )}

        {/* 滑动指示器 */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-lg transition-transform duration-300 ease-out z-0 ${
            isGlass ? "bg-white/90 shadow-sm" : "bg-stone-700"
          }`}
          style={{
            transform: mode === "photo" ? "translateX(2px)" : "translateX(calc(100% + 2px))",
          }}
        />

        <button
          type="button"
          onClick={() => onModeChange("photo")}
          className={`relative z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
            mode === "photo"
              ? isGlass
                ? "text-stone-800"
                : "text-white"
              : isGlass
                ? "text-stone-600 hover:text-stone-800"
                : "text-stone-600 hover:text-stone-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
          </svg>
          <span>照片</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("roam")}
          className={`relative z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
            mode === "roam"
              ? isGlass
                ? "text-stone-800"
                : "text-white"
              : isGlass
                ? "text-stone-600 hover:text-stone-800"
                : "text-stone-600 hover:text-stone-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span>漫游</span>
        </button>
      </div>

      {/* 底部环境光投影（仅solid模式） */}
      {!isGlass && (
        <div className="absolute -bottom-2 left-[15%] w-[70%] h-4 bg-stone-900/5 blur-xl -z-10 pointer-events-none" />
      )}
    </div>
  );
}
