"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { SplatScene } from "@/app/_components/splat-scene";
import { ProgressBar } from "./_components/progress-bar";
import { InteractionTutorial } from "@/app/_components/interaction-tutorial";
import { TutorialButton } from "@/app/_components/tutorial-button";
import { AnimatedTitle, GlassPanel, ExpandButton } from "@/app/_components/home-ui";

type ProcessStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "converting"
  | "compressing"
  | "completed"
  | "failed";

const ENTRANCE_DURATION = 3000;

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // UI 状态
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);
  const [isTitleAtTop, setIsTitleAtTop] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isFirstShow, setIsFirstShow] = useState(true);

  const handleSceneLoaded = useCallback(() => {
    setIsSceneLoaded(true);
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

  const handleUpload = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setErrorMessage("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/predict", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("上传失败");
        }

        const data = await response.json();
        const newTaskId = data.task_id;
        setStatus(data.status as ProcessStatus);

        const eventSource = new EventSource(`/api/stream/${newTaskId}`);
        let hasCompleted = false;

        eventSource.addEventListener("status", (event) => {
          try {
            const statusData = JSON.parse(event.data);

            if (statusData.status === "completed") {
              hasCompleted = true;
              eventSource.close();
              setIsNavigating(true);
              setTimeout(() => {
                router.push(`/viewer/${newTaskId}`);
              }, 100);
            } else if (statusData.status === "failed") {
              hasCompleted = true;
              eventSource.close();
              setStatus("failed");
              setErrorMessage(statusData.message || "处理失败");
            } else {
              setStatus(statusData.status as ProcessStatus);
            }
          } catch (e) {
            console.error("Failed to parse SSE data:", e);
          }
        });

        eventSource.onerror = () => {
          eventSource.close();

          if (!hasCompleted) {
            setTimeout(() => {
              const retrySource = new EventSource(`/api/stream/${newTaskId}`);

              retrySource.addEventListener("status", (retryEvent) => {
                try {
                  const retryData = JSON.parse(retryEvent.data);
                  if (retryData.status === "completed") {
                    hasCompleted = true;
                    retrySource.close();
                    setIsNavigating(true);
                    setTimeout(() => {
                      router.push(`/viewer/${newTaskId}`);
                    }, 100);
                  } else if (retryData.status === "failed") {
                    hasCompleted = true;
                    retrySource.close();
                    setStatus("failed");
                    setErrorMessage(retryData.message || "处理失败");
                  } else {
                    setStatus(retryData.status as ProcessStatus);
                  }
                } catch {
                  retrySource.close();
                  setStatus("failed");
                  setErrorMessage("连接中断");
                }
              });

              retrySource.onerror = () => {
                retrySource.close();
                if (!hasCompleted) {
                  setStatus("failed");
                  setErrorMessage("连接中断");
                }
              };
            }, 1000);
          }
        };
      } catch (error) {
        setStatus("failed");
        setErrorMessage(error instanceof Error ? error.message : "未知错误");
      }
    },
    [router]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleClick = useCallback(() => {
    if (status === "idle" || status === "failed") {
      inputRef.current?.click();
    }
  }, [status]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setErrorMessage("");
    setIsNavigating(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleTutorialClick = () => {
    setShowTutorial(true);
    localStorage.setItem("moment3d-tutorial-seen", "true");
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  const isProcessing = status !== "idle" && status !== "failed" && !isNavigating;

  return (
    <main
      className="h-screen w-screen relative overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* 3D 背景 */}
      <div className="absolute inset-0">
        <Canvas
          gl={{ antialias: false }}
          style={{
            background:
              "linear-gradient(135deg, #faf7f0 0%, #f5f1e8 50%, #ede7d3 100%)",
          }}
        >
          <SplatScene url="/demo.sog" effect="Magic" onLoaded={handleSceneLoaded} />
        </Canvas>
      </div>

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
      <AnimatePresence mode="wait">
        {isTitleAtTop && isPanelVisible && (
          <motion.div
            className="absolute inset-x-0 top-[33%] -translate-y-1/2 flex justify-center z-30 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassPanel onCollapse={collapsePanel} slideDirection={isFirstShow ? "up" : "down"}>
              <p className="text-center text-stone-700 mb-3 text-xl font-medium">
                定格瞬间，留住世界
              </p>

              <p className="text-center text-stone-500 text-sm mb-4 leading-relaxed">
                每一张照片都承载着珍贵的回忆
                <br />
                将美好的时光转化为可以重新体验的 3D 世界
                <br />
                让记忆变得触手可及
              </p>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {status === "idle" && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleClick}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-stone-700 hover:bg-stone-800 text-white font-medium transition-colors cursor-pointer"
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
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>回到那天 →</span>
                  </button>
                  <p className="mt-3 text-stone-400 text-xs">
                    支持 JPG、PNG 格式 · 点击或拖放图片
                  </p>
                </div>
              )}

              {isProcessing && <ProgressBar status={status} />}

              {isNavigating && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 text-stone-600">
                    <div className="w-5 h-5 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">正在跳转...</span>
                  </div>
                </div>
              )}

              {status === "failed" && (
                <div className="text-center space-y-4">
                  <p className="text-red-600 text-sm">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="px-5 py-2 rounded-lg bg-stone-700 hover:bg-stone-800 text-white text-sm transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 交互教程按钮 - 随面板一起显示/隐藏 */}
      <AnimatePresence>
        {isPanelVisible && (
          <motion.div
            className="absolute top-20 md:top-6 right-4 md:right-6 z-40"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <TutorialButton onClick={handleTutorialClick} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 交互教程弹窗 */}
      {showTutorial && <InteractionTutorial onClose={handleCloseTutorial} />}
    </main>
  );
}
