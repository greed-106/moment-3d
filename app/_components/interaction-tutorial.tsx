"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { isMobileDevice } from "@/app/_components/splat-viewer/utils";

const TUTORIAL_STORAGE_KEY = "moment3d-tutorial-never-show";

interface InteractionTutorialProps {
  onClose: () => void;
}

export function InteractionTutorial({ onClose }: InteractionTutorialProps) {
  const isMobile = isMobileDevice();
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const handleClose = () => {
    if (neverShowAgain) localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    onClose();
  };

  const instructions = isMobile 
    ? {
        photo: [{ title: "视差体验", desc: "单指滑动感受空间变化" }],
        roam: [
          { title: "旋转观察", desc: "单指在场景中滑动" },
          { title: "平移视角", desc: "双指同时按住并滑动" },
          { title: "缩放场景", desc: "双指捏合或张开" },
        ],
      }
    : {
        photo: [{ title: "视差体验", desc: "拖动鼠标体验空间深浅" }],
        roam: [
          { title: "旋转视角", desc: "鼠标左键按住并拖动" },
          { title: "平移相机", desc: "鼠标右键按住并拖动" },
          { title: "缩放画面", desc: "滚动鼠标滚轮" },
        ],
      };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-[400px]"
      >
        {/* 主容器 - 镜像 GlassPanel 的设计语言 */}
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.02)]">
          
          {/* 顶部微高光 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent z-10" />
          {/* 背景质感渐变 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-stone-50/50 pointer-events-none" />

          <div className="relative p-8 pt-10">
            {/* 标题部分 - 极其克制 */}
            <header className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-stone-900 tracking-tight">交互指南</h2>
              <div className="mt-3 flex justify-center">
                <div className="h-0.5 w-8 rounded-full bg-stone-200" />
              </div>
            </header>

            <div className="space-y-6">
              {/* 分组：使用和你面板一致的间距和字体 */}
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">照片模式</span>
                  <div className="h-px flex-1 bg-stone-100" />
                </div>
                {instructions.photo.map((item, i) => (
                  <div key={i} className="px-1">
                    <h4 className="text-base font-semibold text-stone-800">{item.title}</h4>
                    <p className="text-sm text-stone-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">漫游模式</span>
                  <div className="h-px flex-1 bg-stone-100" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {instructions.roam.map((item, i) => (
                    <div key={i} className="px-1 border-l-2 border-stone-100 pl-4 hover:border-stone-200 transition-colors">
                      <h4 className="text-base font-semibold text-stone-800">{item.title}</h4>
                      <p className="text-sm text-stone-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* 底部操作区 */}
            <footer className="mt-8 pt-5 border-t border-stone-50 space-y-4">
              <label className="flex items-center justify-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={neverShowAgain}
                  onChange={(e) => setNeverShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-0 transition-all cursor-pointer"
                />
                <span className="text-sm font-medium text-stone-400 group-hover:text-stone-600 transition-colors">不再提示</span>
              </label>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-stone-700 hover:bg-stone-800 text-white rounded-xl font-medium text-base shadow-[0_8px_20px_-4px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all"
              >
                开始探索
              </button>
            </footer>
          </div>
        </div>

        {/* 底部环境阴影 - 镜像 GlassPanel 风格 */}
        <div 
          className="absolute -bottom-6 left-[15%] w-[70%] h-10 bg-stone-900/5 blur-3xl -z-10 pointer-events-none" 
        />
      </motion.div>
    </div>
  );
}

const SESSION_TUTORIAL_KEY = "moment3d-tutorial-session-shown";

// 检查是否应该显示教程（用于外部调用）
export function shouldShowTutorial(): boolean {
  if (typeof window === "undefined") return false;
  // 用户选择了"不再提示"
  if (localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true") return false;
  // 本次会话已经显示过
  if (sessionStorage.getItem(SESSION_TUTORIAL_KEY) === "true") return false;
  return true;
}

// 标记本次会话已显示教程
export function markTutorialShown(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_TUTORIAL_KEY, "true");
}