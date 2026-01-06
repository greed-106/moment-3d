"use client";

import { useState, useEffect } from "react";

interface InteractionTutorialProps {
  onClose: () => void;
}

export function InteractionTutorial({ onClose }: InteractionTutorialProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测是否为移动设备
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        "mobile",
        "android",
        "iphone",
        "ipad",
        "tablet",
      ];
      return (
        mobileKeywords.some((keyword) => userAgent.includes(keyword)) ||
        window.innerWidth <= 768
      );
    };

    setIsMobile(checkMobile());

    // 监听窗口大小变化
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md border border-stone-200/50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <span>🎮</span>
            交互指南 - {deviceType}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {instructions.map((instruction, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-4 bg-stone-50 rounded-lg"
            >
              {/* Icon + Title 在同一行，整体居中 */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{instruction.icon}</span>
                <h3 className="font-semibold text-stone-800">{instruction.title}</h3>
              </div>

              {/* 描述和细节居中 */}
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
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

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-lg transition-colors font-medium"
          >
            开始体验
          </button>
        </div>
      </div>
    </div>
  );
}
