"use client";

import { useState, useCallback, useRef, useEffect, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import {
  SplatScene,
  parseBackendMetadata,
  type CameraMetadata,
  type BackendMetadata,
} from "@/app/_components/splat-scene";
import { InteractionTutorial } from "@/app/_components/interaction-tutorial";
import { TutorialButton } from "@/app/_components/tutorial-button";
import { AnimatedTitle, GlassPanel, ExpandButton } from "@/app/_components/home-ui";

const ENTRANCE_DURATION = 3000;

// 将 3D 场景抽离为独立的 memo 组件，避免父组件状态变化导致重新渲染
interface SceneBackgroundProps {
  cameraMetadata: CameraMetadata | null;
  onLoaded: () => void;
  resetCameraHandler?: { reset?: () => void };
}

const SceneBackground = memo(function SceneBackground({
  cameraMetadata,
  onLoaded,
  resetCameraHandler,
}: SceneBackgroundProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        gl={{ antialias: false }}
        style={{
          background:
            "linear-gradient(135deg, #faf7f0 0%, #f5f1e8 50%, #ede7d3 100%)",
        }}
      >
        <SplatScene
          url="/demo.sog"
          effect="Magic"
          onLoaded={onLoaded}
          cameraMetadata={cameraMetadata}
          resetCameraHandler={resetCameraHandler}
        />
      </Canvas>
    </div>
  );
});

export default function Home() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);
  const [isTitleAtTop, setIsTitleAtTop] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isFirstShow, setIsFirstShow] = useState(true);
  
  // Demo 场景的相机元数据
  const [demoCameraMetadata, setDemoCameraMetadata] =
    useState<CameraMetadata | null>(null);
  
  // 相机复位处理
  const resetCameraHandler = useRef<{ reset?: () => void }>({});

  // 稳定 onLoaded 回调的引用
  const handleSceneLoaded = useCallback(() => {
    setIsSceneLoaded(true);
  }, []);

  // 加载 demo 场景的元数据
  useEffect(() => {
    const loadDemoMetadata = async () => {
      try {
        const response = await fetch("/demo-meta.json");
        if (response.ok) {
          const data: BackendMetadata = await response.json();
          const parsed = parseBackendMetadata(data);
          if (parsed) {
            setDemoCameraMetadata(parsed);
          }
        }
      } catch (error) {
        console.warn("[Home] Failed to load demo metadata:", error);
      }
    };
    loadDemoMetadata();
  }, []);

  // 场景加载完成后，3秒后标题开始移动，标题移动完成后再显示面板
  useEffect(() => {
    if (!isSceneLoaded) return;
    // 3秒后标题开始移动
    const titleTimer = setTimeout(() => {
      setIsTitleAtTop(true);
    }, ENTRANCE_DURATION);
    // 标题移动动画0.8秒 + 额外0.3秒延迟后显示面板
    const panelTimer = setTimeout(() => {
      setIsPanelVisible(true);
    }, ENTRANCE_DURATION + 1100);
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(panelTimer);
    };
  }, [isSceneLoaded]);

  const collapsePanel = useCallback(() => {
    setIsPanelVisible(false);
  }, []);

  const expandPanel = useCallback(() => {
    setIsFirstShow(false);
    setIsPanelVisible(true);
  }, []);

  const handleTutorialClick = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleResetCamera = () => {
    resetCameraHandler.current.reset?.();
  };

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100">
      {/* 3D 背景 - 使用 memo 组件避免重新渲染 */}
      <SceneBackground
        cameraMetadata={demoCameraMetadata}
        onLoaded={handleSceneLoaded}
        resetCameraHandler={resetCameraHandler.current}
      />

      {/* 标题 - 始终存在，位置根据状态变化 */}
      {isSceneLoaded && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
          initial={{ top: "25%", y: "-50%" }}
          animate={{
            top: isTitleAtTop ? "1.5rem" : "25%",
            y: isTitleAtTop ? "0%" : "-50%",
          }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <AnimatedTitle />
          {/* 展开按钮 - 标题正下方，仅在面板隐藏时显示 */}
          <div className="h-12 flex items-center justify-center">
            <AnimatePresence>
              {isTitleAtTop && !isPanelVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ExpandButton onClick={expandPanel} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* 面板 */}
      <AnimatePresence>
        {isTitleAtTop && isPanelVisible && (
          <div className="absolute inset-x-0 top-[33%] -translate-y-1/2 flex justify-center z-30 px-4">
            <GlassPanel onCollapse={collapsePanel} slideDirection={isFirstShow ? "up" : "down"}>
              <p className="text-center text-stone-700 mb-2 text-xl font-medium">
                定格瞬间，留住世界
              </p>

              <p className="text-center text-stone-500 text-sm leading-snug">
                每一张照片都承载着珍贵的回忆
                <br />
                将美好的时光转化为可以重新体验的 3D 世界
                <br />
                让记忆变得触手可及
              </p>
            </GlassPanel>
          </div>
        )}
      </AnimatePresence>

      {/* 交互教程按钮 - 随面板一起显示/隐藏 */}
      {isPanelVisible && (
        <div className="absolute top-20 md:top-6 right-4 md:right-6 z-40">
          <TutorialButton onClick={handleTutorialClick} />
        </div>
      )}

      {/* 相机复位按钮 - 左上角 */}
      {isPanelVisible && (
        <div className="absolute top-6 left-6 z-40 pointer-events-none">
          <div className="pointer-events-auto">
            <button
              onClick={handleResetCamera}
              className="relative flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/50 text-stone-700 hover:bg-white/80 hover:text-stone-800 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.12)] active:scale-[0.98] overflow-hidden"
            >
              {/* 顶部高光边缘 */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              
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
              <span className="relative z-10">相机复位</span>
            </button>
          </div>
        </div>
      )}

      {/* 交互教程弹窗 */}
      {showTutorial && <InteractionTutorial onClose={handleCloseTutorial} />}
    </main>
  );
}
