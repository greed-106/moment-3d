"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { SplatScene } from "@/app/_components/splat-scene";
import { ProgressBar } from "./_components/progress-bar";
import { InteractionTutorial } from "@/app/_components/interaction-tutorial";

type ProcessStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "converting"
  | "compressing"
  | "completed"
  | "failed";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showPanel, setShowPanel] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

        // 建立 SSE 连接
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

          // 只有在未完成的情况下才尝试重连
          if (!hasCompleted) {
            console.log("SSE connection lost, attempting to reconnect...");

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
                } catch (e) {
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
          <SplatScene url="/demo.sog" effect="Magic" />
        </Canvas>
      </div>

      {/* 毛玻璃卡片 */}
      {showPanel && (
        <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-30">
          <div
            onClick={handleClick}
            className={`
              pointer-events-auto w-full max-w-md p-8 rounded-2xl
              bg-white/80 backdrop-blur-sm border border-stone-200/50
              shadow-xl transition-all duration-300
              ${status === "idle" || status === "failed" ? "cursor-pointer hover:bg-white/90 hover:shadow-2xl" : ""}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Logo */}
            <h1 className="text-4xl font-bold text-center mb-2 text-stone-800">
              Moment3D
            </h1>

            {/* Slogan */}
            <p className="text-center text-stone-600 mb-6 text-lg">
              定格瞬间，留住世界
            </p>

            {/* 描述文字 */}
            <p className="text-center text-stone-500 text-sm mb-8 leading-relaxed">
              每一张照片都承载着珍贵的回忆
              <br />
              将美好的时光转化为可以重新体验的 3D 世界
              <br />
              让记忆变得触手可及
            </p>

            {/* 状态区域 */}
            {status === "idle" && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-stone-700 hover:bg-stone-800 text-white font-medium transition-colors">
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
                </div>
                <p className="mt-4 text-stone-400 text-xs">
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
          </div>
        </div>
      )}

      {/* 交互指南按钮 */}
      <button
        onClick={() => setShowTutorial(true)}
        className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm hover:bg-white border border-stone-200/50 text-stone-700 hover:text-stone-800 px-4 py-2 rounded-lg transition-colors font-medium shadow-lg flex items-center gap-2 z-40"
      >
        <span>🎮</span>
        交互指南
      </button>

      {/* 交互指南弹窗 */}
      {showTutorial && (
        <InteractionTutorial onClose={() => setShowTutorial(false)} />
      )}
    </main>
  );
}
