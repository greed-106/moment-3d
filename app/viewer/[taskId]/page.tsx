"use client";

import { use, Suspense, useState, useEffect, memo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  SplatScene,
  type CameraMetadata,
  type ViewMode,
  parseBackendMetadata,
  type BackendMetadata,
  isMobileDevice,
} from "@/app/_components/splat-viewer";
import { InteractionTutorial, shouldShowTutorial, markTutorialShown } from "@/app/_components/interaction-tutorial";
import type { EffectType } from "@/app/_components/splat-effects";
import { ViewerHeader } from "./_components/viewer-header";
import { EffectControl } from "./_components/effect-control";
import { LoadingScreen } from "./_components/loading-screen";

interface ViewerPageProps {
  params: Promise<{ taskId: string }>;
}

// 相机元数据获取 hook
function useCameraMetadata(taskId: string) {
  const [cameraMetadata, setCameraMetadata] = useState<CameraMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/metadata/${taskId}`);

        if (!response.ok) {
          throw new Error(`获取元数据失败: ${response.status}`);
        }

        const data: BackendMetadata = await response.json();
        const parsed = parseBackendMetadata(data);

        if (parsed) {
          setCameraMetadata(parsed);
        } else {
          console.warn("[useCameraMetadata] Failed to parse metadata, using defaults");
        }
      } catch (error) {
        console.error("[useCameraMetadata] Metadata fetch error:", error);
        setError(error instanceof Error ? error.message : "未知错误");
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [taskId]);

  return { cameraMetadata, loading, error };
}

// 将 3D 场景抽离为独立的 memo 组件
interface SceneViewerProps {
  taskId: string;
  effect: EffectType;
  viewMode: ViewMode;
  cameraMetadata: CameraMetadata | null;
}

const SceneViewer = memo(function SceneViewer({
  taskId,
  effect,
  viewMode,
  cameraMetadata,
}: SceneViewerProps) {
  return (
    <Canvas
      gl={{ antialias: false }}
      className="h-full w-full"
      style={{
        background:
          "linear-gradient(135deg, #faf7f0 0%, #f5f1e8 50%, #ede7d3 100%)",
      }}
    >
      <SplatScene
        url={`/api/result/${taskId}`}
        effect={effect}
        viewMode={viewMode}
        cameraMetadata={cameraMetadata}
      />
    </Canvas>
  );
});

export default function ViewerPage({ params }: ViewerPageProps) {
  const { taskId } = use(params);
  const [effect, setEffect] = useState<EffectType>("None");
  const [viewMode, setViewMode] = useState<ViewMode>("photo");
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = isMobileDevice();
  const { cameraMetadata, loading: metadataLoading, error: metadataError } = useCameraMetadata(taskId);

  // 检查是否需要显示教程
  useEffect(() => {
    // 如果用户选择了"不再提示"，或本次会话已经显示过，则不显示
    if (!shouldShowTutorial()) {
      return;
    }

    // 延迟 1 秒后显示教程
    tutorialTimerRef.current = setTimeout(() => {
      setShowTutorial(true);
      markTutorialShown();
    }, 1000);

    return () => {
      if (tutorialTimerRef.current) {
        clearTimeout(tutorialTimerRef.current);
      }
    };
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  // 移动端切换到 Spread 时自动切换为 Magic
  useEffect(() => {
    if (isMobile && effect === "Spread") {
      setEffect("Magic");
    }
  }, [isMobile, effect]);

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100">
      {/* 3D 渲染区域 */}
      <Suspense fallback={<LoadingScreen message="加载场景中..." />}>
        {metadataLoading ? (
          <LoadingScreen message="获取场景信息..." />
        ) : (
          <SceneViewer
            taskId={taskId}
            effect={effect}
            viewMode={viewMode}
            cameraMetadata={cameraMetadata}
          />
        )}
      </Suspense>

      {/* 顶部导航（包含返回按钮和模式切换） */}
      <ViewerHeader viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* 粒子效果控制 */}
      <EffectControl
        effect={effect}
        onEffectChange={setEffect}
        isMobile={isMobile}
        metadataError={metadataError}
      />

      {/* 交互教程弹窗 */}
      {showTutorial && <InteractionTutorial onClose={closeTutorial} />}
    </main>
  );
}
