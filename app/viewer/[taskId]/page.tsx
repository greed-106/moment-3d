"use client";

import { use, Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { SplatScene } from "@/app/_components/splat-scene";
import { InteractionTutorial } from "@/app/_components/interaction-tutorial";
import type { EffectType } from "@/app/_components/splat-effects";

interface ViewerPageProps {
  params: Promise<{ taskId: string }>;
}

export default function ViewerPage({ params }: ViewerPageProps) {
  const { taskId } = use(params);
  const [showTutorial, setShowTutorial] = useState(false);
  const [effect, setEffect] = useState<EffectType>("None");
  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端设备
  useEffect(() => {
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

    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 移动端切换到 Spread 时自动切换为 Magic
  useEffect(() => {
    if (isMobile && effect === "Spread") {
      setEffect("Magic");
    }
  }, [isMobile, effect]);

  // 获取可用的效果选项
  const getAvailableEffects = () => {
    const allEffects: { value: EffectType; label: string }[] = [
      { value: "None", label: "无效果" },
      { value: "Magic", label: "Magic" },
      { value: "Spread", label: "Spread" },
      { value: "Unroll", label: "Unroll" },
      { value: "Twister", label: "Twister" },
      { value: "Rain", label: "Rain" },
    ];

    // 移动端时过滤掉 Spread 效果
    if (isMobile) {
      return allEffects.filter((effect) => effect.value !== "Spread");
    }

    return allEffects;
  };

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100">
      {/* 3D 渲染区域 */}
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          gl={{ antialias: false }}
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(135deg, #faf7f0 0%, #f5f1e8 50%, #ede7d3 100%)",
          }}
        >
          <SplatScene url={`/api/result/${taskId}`} effect={effect} />
        </Canvas>
      </Suspense>

      {/* 顶部导航 */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between pointer-events-none z-10">
        <a
          href="/"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-stone-200/50 text-stone-700 hover:bg-white hover:text-stone-800 transition-colors shadow-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>返回</span>
        </a>
      </header>

      {/* 粒子效果控制 */}
      <div className="absolute top-20 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-stone-200/50 text-stone-800 min-w-[180px] z-40 shadow-lg pointer-events-auto">
        <div className="mb-3 font-semibold text-sm flex items-center gap-2">
          粒子效果
          {isMobile && (
            <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded">
              移动端优化
            </span>
          )}
        </div>
        <select
          value={effect}
          onChange={(e) => setEffect(e.target.value as EffectType)}
          className="w-full p-2 rounded-lg border border-stone-300 bg-white text-stone-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-500"
        >
          {getAvailableEffects().map((effectOption) => (
            <option key={effectOption.value} value={effectOption.value}>
              {effectOption.label}
            </option>
          ))}
        </select>
      </div>

      {/* 交互教程按钮 */}
      <button
        onClick={() => setShowTutorial(true)}
        className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm hover:bg-white border border-stone-200/50 text-stone-700 hover:text-stone-800 px-4 py-2 rounded-lg transition-colors font-medium shadow-lg flex items-center gap-2 z-40 pointer-events-auto"
      >
        <span>🎮</span>
        交互教程
      </button>

      {/* 交互教程弹窗 */}
      {showTutorial && (
        <InteractionTutorial onClose={() => setShowTutorial(false)} />
      )}
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-stone-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-stone-600">加载场景中...</p>
      </div>
    </div>
  );
}
