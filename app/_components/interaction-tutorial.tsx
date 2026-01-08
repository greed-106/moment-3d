"use client";

import { useState } from "react";
import { isMobileDevice } from "@/app/_components/splat-viewer/utils";

const TUTORIAL_STORAGE_KEY = "moment3d-tutorial-never-show";
const SESSION_TUTORIAL_KEY = "moment3d-tutorial-session-shown";

interface InteractionTutorialProps {
  onClose: () => void;
}

export function InteractionTutorial({ onClose }: InteractionTutorialProps) {
  const isMobile = isMobileDevice();
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const handleClose = () => {
    if (neverShowAgain) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    }
    onClose();
  };

  const pcInstructions = [
    {
      icon: "🖱️",
      title: "鼠标左键",
      description: "按住左键拖动旋转视角",
      detail: "围绕3D场景进行360度观察",
    },
    {
      icon: "🖱️",
      title: "鼠标右键",
      description: "按住右键拖动移动视角",
      detail: "平移视角位置，改变观察点",
    },
    {
      icon: "🎯",
      title: "滚轮",
      description: "滚动滚轮放大缩小",
      detail: "向前滚动放大，向后滚动缩小",
    },
  ];

  const mobileInstructions = [
    {
      icon: "👆",
      title: "单指拖动",
      description: "单指拖动旋转视角",
      detail: "围绕3D场景进行360度观察",
    },
    {
      icon: "✌️",
      title: "双指拖动",
      description: "双指同时拖动移动视角",
      detail: "平移视角位置，改变观察点",
    },
    {
      icon: "🤏",
      title: "双指捏合",
      description: "双指捏合放大缩小",
      detail: "捏合缩小，张开放大场景",
    },
  ];

  const instructions = isMobile ? mobileInstructions : pcInstructions;
  const deviceType = isMobile ? "移动端" : "PC端";

  return (
    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-200 overflow-hidden">
        {/* 顶部高光 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent z-10" />
        
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-stone-50/50 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <span>🎮</span>
              交互指南 - {deviceType}
            </h2>
            <button
              onClick={handleClose}
              className="text-stone-400 hover:text-stone-600 text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {instructions.map((instruction, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 p-4 bg-stone-50 rounded-xl border border-stone-100"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{instruction.icon}</span>
                  <h3 className="font-semibold text-stone-800">{instruction.title}</h3>
                </div>
                <p className="text-stone-600 text-sm text-center">
                  {instruction.description}
                </p>
                <p className="text-stone-500 text-xs text-center">
                  {instruction.detail}
                </p>
              </div>
            ))}
          </div>

          {isMobile && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-lg">💡</span>
                <div>
                  <h4 className="font-medium text-amber-800 text-sm mb-1">
                    温馨提示
                  </h4>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    如果双指拖动视角时感觉动不了，可以先双指捏合把场景缩小一些再试试
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 不再提示复选框 */}
          <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={(e) => setNeverShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-stone-700 focus:ring-stone-500 cursor-pointer"
            />
            <span className="text-stone-500 text-sm">学会啦，不再提示</span>
          </label>

          <div className="flex justify-center">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-xl transition-colors font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            >
              开始体验
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
