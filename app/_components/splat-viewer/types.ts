// ============ 相机元数据类型 ============
export type CameraIntrinsics = {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  imageWidth: number;
  imageHeight: number;
};

export type CameraMetadata = {
  intrinsics: CameraIntrinsics;
  extrinsicCv: number[];
};

// 从后端返回的元数据格式
export type BackendMetadata = {
  task_id: string;
  intrinsic_matrix: number[]; // 3x3 行优先
  extrinsic_matrix: number[]; // 4x4 行优先
  created_at?: string;
};

// ============ 视差状态类型 ============
export type ParallaxState = {
  basePosition: THREE.Vector3;
  baseTarget: THREE.Vector3;
  baseRight: THREE.Vector3;
  baseUp: THREE.Vector3;
  strength: number;
  current: THREE.Vector2;
  target: THREE.Vector2;
};

// ============ 拖动状态类型 ============
export type DragState = {
  mouseX: number;
  mouseY: number;
  parallaxX: number;
  parallaxY: number;
};

import type * as THREE from "three";
