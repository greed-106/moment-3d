"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassPanelProps {
  onCollapse: () => void;
  children: ReactNode;
  slideDirection?: "up" | "down";
}

export function GlassPanel({
  onCollapse,
  children,
  slideDirection = "up",
}: GlassPanelProps) {
  const isFromBottom = slideDirection === "up";

  return (
    <motion.div
      className="w-full max-w-md mx-4 relative"
      initial={{ opacity: 0, y: isFromBottom ? 40 : -40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isFromBottom ? 40 : -40, scale: 0.98 }}
      transition={{
        duration: 0.35, // 稍微拉长一点点，让动画更平滑
        ease: [0.16, 1, 0.3, 1], // 更细腻的超缓动曲线
      }}
      style={{ 
        // 核心性能优化：强制提升为合成层
        willChange: "transform, opacity",
        transformPerspective: 1000,
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased"
      }}
    >
      {/* 主容器：整合了背景、边框和阴影 */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-stone-200 shadow-[0_12px_40px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)]">
        
        {/* 顶部微高光边缘 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent z-10" />

        {/* 背景质感渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-stone-50/30 pointer-events-none" />

        <div className="relative p-4 md:p-6 pt-1">
          {/* 收起按钮 - ^ 形状 */}
          <div className="flex justify-center mb-1">
            <button
              type="button"
              onClick={onCollapse}
              className="group py-1.5 px-6 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="收起面板"
            >
              <svg 
                className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* 内容渲染层 */}
          <div className="relative z-10">{children}</div>
        </div>
      </div>

      {/* 底部环境光投影 - 采用模糊度极高的轻量化设计 */}
      <div 
        className="absolute -bottom-4 left-[10%] w-[80%] h-8 bg-stone-900/5 blur-2xl -z-10 pointer-events-none" 
        style={{ transform: 'translateZ(0)' }}
      />
    </motion.div>
  );
}