import type { CameraMetadata } from "./types";

// ============ 视差效果参数 ============
export const PARALLAX_STRENGTH_MULTIPLIER = 10.0;
export const PARALLAX_STRENGTH_MOBILE_MULTIPLIER = 15.5;

// 滑动/拖动灵敏度
export const DRAG_SENSITIVITY_PC = 2.0;
export const DRAG_SENSITIVITY_MOBILE = 0.05;

// ============ 默认相机参数（用于demo或无元数据时的回退） ============
export const DEFAULT_CAMERA_METADATA: CameraMetadata = {
  intrinsics: {
    fx: 1211.662109,
    fy: 1211.662109,
    cx: 495.0,
    cy: 720.0,
    imageWidth: 990,
    imageHeight: 1440,
  },
  extrinsicCv: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
};
