// 类型导出
export type {
  CameraIntrinsics,
  CameraMetadata,
  BackendMetadata,
  ParallaxState,
  DragState,
} from "./types";

// 常量导出
export {
  PARALLAX_STRENGTH_MULTIPLIER,
  PARALLAX_STRENGTH_MOBILE_MULTIPLIER,
  DRAG_SENSITIVITY_PC,
  DRAG_SENSITIVITY_MOBILE,
  DEFAULT_CAMERA_METADATA,
} from "./constants";

// 工具函数导出
export {
  parseBackendMetadata,
  makeAxisFlipCvToGl,
  quantileSorted,
  computeDepthFocus,
  isMobileDevice,
  makeProjectionFromIntrinsics,
} from "./utils";

// Hook 导出
export { useParallaxControls } from "./use-parallax-controls";
export { useCameraProjection } from "./use-camera-projection";
export { useDragControls } from "./use-drag-controls";

// 组件导出
export { SplatScene } from "./splat-scene";
