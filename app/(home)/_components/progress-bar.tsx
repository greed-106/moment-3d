"use client";

type ProcessStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "converting"
  | "compressing"
  | "completed"
  | "failed";

interface ProgressBarProps {
  status: ProcessStatus;
}

const STEPS: { key: ProcessStatus; label: string }[] = [
  { key: "uploading", label: "上传" },
  { key: "queued", label: "排队" },
  { key: "converting", label: "重建" },
  { key: "compressing", label: "压缩" },
];

function getStepIndex(status: ProcessStatus): number {
  const index = STEPS.findIndex((s) => s.key === status);
  return index === -1 ? 0 : index;
}

export function ProgressBar({ status }: ProgressBarProps) {
  const currentIndex = getStepIndex(status);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-4">
      {/* 进度条 */}
      <div className="relative">
        {/* 背景轨道 */}
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
          {/* 进度填充 */}
          <div
            className="h-full bg-stone-700 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 节点 */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between">
          {STEPS.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div
                key={step.key}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300 border-2
                  ${
                    isCompleted
                      ? "bg-stone-700 border-stone-700"
                      : isActive
                        ? "bg-white border-stone-700 ring-4 ring-stone-200"
                        : "bg-stone-100 border-stone-300"
                  }
                `}
              />
            );
          })}
        </div>
      </div>

      {/* 步骤标签 */}
      <div className="flex justify-between text-xs">
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <span
              key={step.key}
              className={`
                transition-colors duration-300
                ${isActive ? "text-stone-800 font-medium" : isCompleted ? "text-stone-600" : "text-stone-400"}
              `}
            >
              {step.label}
            </span>
          );
        })}
      </div>

      {/* 当前状态提示 */}
      <p className="text-center text-stone-500 text-sm">
        {status === "uploading" && "正在上传图片..."}
        {status === "queued" && "已加入队列，稍等片刻..."}
        {status === "converting" && "AI 正在将回忆编织成 3D 空间..."}
        {status === "compressing" && "正在打包可重温的时光..."}
      </p>
    </div>
  );
}
