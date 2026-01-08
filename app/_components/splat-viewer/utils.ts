import * as THREE from "three";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import type { BackendMetadata, CameraMetadata } from "./types";

// ============ 解析后端元数据 ============
export function parseBackendMetadata(
  raw: BackendMetadata
): CameraMetadata | null {
  const intrinsic = raw.intrinsic_matrix;
  const extrinsic = raw.extrinsic_matrix;

  if (!intrinsic || intrinsic.length !== 9) return null;
  if (!extrinsic || extrinsic.length !== 16) return null;

  // 从3x3内参矩阵提取参数
  const fx = intrinsic[0];
  const fy = intrinsic[4];
  const cx = intrinsic[2];
  const cy = intrinsic[5];

  // 从内参推断图像尺寸
  const imageWidth = Math.round(cx * 2);
  const imageHeight = Math.round(cy * 2);

  return {
    intrinsics: { fx, fy, cx, cy, imageWidth, imageHeight },
    extrinsicCv: extrinsic,
  };
}

// ============ CV坐标系到GL坐标系的转换矩阵 ============
export const makeAxisFlipCvToGl = () =>
  new THREE.Matrix4().set(
    1, 0, 0, 0,
    0, -1, 0, 0,
    0, 0, -1, 0,
    0, 0, 0, 1
  );

// ============ 计算排序数组的分位数 ============
export const quantileSorted = (sorted: number[], q: number): number | null => {
  if (sorted.length === 0) return null;
  const clampedQ = Math.max(0, Math.min(1, q));
  const pos = (sorted.length - 1) * clampedQ;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const weight = pos - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

// ============ 计算深度焦点（分析点云数据） ============
export const computeDepthFocus = (
  mesh: SparkSplatMesh,
  { qFocus = 0.1, minDepthFocus = 0.5, maxSamples = 50000 } = {}
): number => {
  const numSplats = mesh?.packedSplats?.numSplats ?? 0;
  if (!numSplats) return minDepthFocus;

  const step = Math.max(1, Math.floor(numSplats / maxSamples));
  const depths: number[] = [];

  for (let i = 0; i < numSplats; i += step) {
    const { center } = mesh.packedSplats.getSplat(i);
    const { z } = center;
    if (Number.isFinite(z) && z > 0) depths.push(z);
  }

  if (depths.length === 0) return minDepthFocus;
  depths.sort((a, b) => a - b);
  const q = quantileSorted(depths, qFocus);
  if (!Number.isFinite(q)) return minDepthFocus;
  return Math.max(minDepthFocus, q!);
};

// ============ 检测是否为移动设备 ============
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth <= 768 ||
    /mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent)
  );
};

// ============ 根据内参计算投影矩阵 ============
export const makeProjectionFromIntrinsics = ({
  fx,
  fy,
  cx,
  cy,
  width,
  height,
  near,
  far,
}: {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  near: number;
  far: number;
}) => {
  const left = (-cx * near) / fx;
  const right = ((width - cx) * near) / fx;
  const top = (cy * near) / fy;
  const bottom = (-(height - cy) * near) / fy;

  return new THREE.Matrix4().set(
    (2 * near) / (right - left), 0, (right + left) / (right - left), 0,
    0, (2 * near) / (top - bottom), (top + bottom) / (top - bottom), 0,
    0, 0, -(far + near) / (far - near), (-2 * far * near) / (far - near),
    0, 0, -1, 0
  );
};

// ============ 计算照片模式的相机状态 ============
export interface PhotoModeCameraState {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  target: THREE.Vector3;
}

export const computePhotoModeCamera = (
  mesh: SparkSplatMesh,
  group: THREE.Group,
  extrinsicCv: number[]
): PhotoModeCameraState | null => {
  if (!mesh || !group) return null;

  const cvToGl = makeAxisFlipCvToGl();
  const e = extrinsicCv;
  const extrinsicMatrix = new THREE.Matrix4().set(
    e[0], e[1], e[2], e[3],
    e[4], e[5], e[6], e[7],
    e[8], e[9], e[10], e[11],
    e[12], e[13], e[14], e[15]
  );

  const view = new THREE.Matrix4()
    .multiplyMatrices(cvToGl, extrinsicMatrix)
    .multiply(cvToGl);
  const cameraWorld = new THREE.Matrix4().copy(view).invert();

  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  cameraWorld.decompose(position, quaternion, scale);

  const depthFocus = computeDepthFocus(mesh);
  const lookAtCv = new THREE.Vector3(0, 0, depthFocus);
  group.updateMatrixWorld(true);
  const target = lookAtCv.clone().applyMatrix4(group.matrixWorld);

  return { position, quaternion, target };
};

// ============ 计算漫游模式的等效 FOV ============
export const computeRoamModeFov = (
  intrinsics: { fy: number; imageWidth: number; imageHeight: number },
  frameSize: { width: number; height: number },
  screenHeight: number
): number => {
  const { fy, imageWidth, imageHeight } = intrinsics;
  // 计算照片模式下的缩放因子
  const sx = frameSize.width / imageWidth;
  const sy = frameSize.height / imageHeight;
  const s = Math.min(sx, sy);
  // 缩放后的焦距
  const scaledFy = fy * s;
  // 计算等效 FOV：使得在全屏视口下，中心区域物体大小与照片模式一致
  const fovRad = 2 * Math.atan(screenHeight / (2 * scaledFy));
  return THREE.MathUtils.radToDeg(fovRad);
};
