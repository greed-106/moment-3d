"use client";

import type { EffectType } from "@/app/_components/splat-effects";

interface EffectControlProps {
  effect: EffectType;
  onEffectChange: (effect: EffectType) => void;
  isMobile: boolean;
  metadataError: string | null;
}

export function EffectControl({
  effect,
  onEffectChange,
  isMobile,
  metadataError,
}: EffectControlProps) {
  const getAvailableEffects = () => {
    const allEffects: { value: EffectType; label: string }[] = [
      { value: "None", label: "无效果" },
      { value: "Magic", label: "Magic" },
      { value: "Spread", label: "Spread" },
      { value: "Unroll", label: "Unroll" },
      { value: "Twister", label: "Twister" },
      { value: "Rain", label: "Rain" },
    ];

    if (isMobile) {
      return allEffects.filter((e) => e.value !== "Spread");
    }

    return allEffects;
  };

  return (
    <div className="absolute top-6 right-6 z-40 pointer-events-auto">
      <div className="relative bg-white/70 backdrop-blur-md rounded-xl p-4 border border-white/50 text-stone-800 min-w-[180px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* 顶部高光边缘 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />

        <div className="relative z-10">
          <div className="mb-3 font-semibold text-sm flex items-center gap-2">
            粒子效果
            {isMobile ? (
              <span className="text-xs text-stone-500 bg-white/50 px-2 py-1 rounded">
                移动端优化
              </span>
            ) : (
              <span className="text-xs text-stone-500 bg-white/50 px-2 py-1 rounded">
                PC端优化
              </span>
            )}
          </div>
          
          <select
            value={effect}
            onChange={(e) => onEffectChange(e.target.value as EffectType)}
            className="w-full p-2 rounded-lg border border-white/50 bg-white/50 text-stone-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {getAvailableEffects().map((effectOption) => (
              <option key={effectOption.value} value={effectOption.value}>
                {effectOption.label}
              </option>
            ))}
          </select>
          
          {/* 元数据状态指示 */}
          {metadataError && (
            <p className="mt-2 text-xs text-amber-600">使用默认相机参数</p>
          )}
        </div>
      </div>
    </div>
  );
}
