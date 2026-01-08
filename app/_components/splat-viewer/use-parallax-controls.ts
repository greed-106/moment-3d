"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import type { ParallaxState, CameraMetadata } from "./types";
import {
  PARALLAX_STRENGTH_MULTIPLIER,
  PARALLAX_STRENGTH_MOBILE_MULTIPLIER,
} from "./constants";
import { makeAxisFlipCvToGl, computeDepthFocus, isMobileDevice } from "./utils";
import { useCameraProjection } from "./use-camera-projection";
import { useDragControls } from "./use-drag-controls";

interface UseParallaxControlsOptions {
  camera: THREE.Camera;
  gl: THREE.WebGLRenderer;
  size: { width: number; height: number };
  cameraMetadata: CameraMetadata;
  enableParallax: boolean;
}

export function useParallaxControls({
  camera,
  gl,
  size,
  cameraMetadata,
  enableParallax,
}: UseParallaxControlsOptions) {
  const parallaxRef = useRef<ParallaxState | null>(null);
  const tempPositionRef = useRef(new THREE.Vector3());
  const splatLoadedRef = useRef(false);
  const meshRefInternal = useRef<SparkSplatMesh | null>(null);
  const groupRefInternal = useRef<THREE.Group | null>(null);

  const { intrinsics, extrinsicCv } = cameraMetadata;
  const isMobile = useMemo(() => isMobileDevice(), []);

  // 稳定 extrinsicCv 的引用，只有值真正变化时才更新
  const stableExtrinsicCv = useMemo(
    () => extrinsicCv,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extrinsicCv.join(",")]
  );

  // 使用相机投影 hook
  const { frameSize, applyCameraProjection } = useCameraProjection({
    camera,
    gl,
    size,
    intrinsics,
  });

  // 使用拖拽控制 hook
  useDragControls({
    gl,
    parallaxRef,
    enabled: enableParallax,
    isMobile,
  });

  // 核心初始化逻辑
  const doInitializeParallax = useCallback(
    (mesh: SparkSplatMesh, cam: THREE.Camera, group: THREE.Group) => {
      const cvToGl = makeAxisFlipCvToGl();

      const e = stableExtrinsicCv;
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

      cam.position.copy(position);
      cam.quaternion.copy(quaternion);
      cam.updateMatrix();
      cam.updateMatrixWorld(true);

      const depthFocus = computeDepthFocus(mesh);
      console.log("[Parallax] Computed depth focus:", depthFocus);

      const lookAtCv = new THREE.Vector3(0, 0, depthFocus);
      group.updateMatrixWorld(true);
      const lookAtWorld = lookAtCv.clone().applyMatrix4(group.matrixWorld);

      const basePosition = cam.position.clone();
      const baseTarget = lookAtWorld;
      const baseQuaternion = cam.quaternion.clone();
      const baseRight = new THREE.Vector3(1, 0, 0).applyQuaternion(baseQuaternion);
      const baseUp = new THREE.Vector3(0, 1, 0).applyQuaternion(baseQuaternion);

      let radius = basePosition.distanceTo(baseTarget);
      if (mesh.getBoundingBox) {
        const box = mesh.getBoundingBox();
        const boxSize = new THREE.Vector3();
        box.getSize(boxSize);
        radius = Math.max(boxSize.length() * 0.5, 0.25);
      }

      const distance = basePosition.distanceTo(baseTarget);
      const baseStrength =
        Math.max(0.003, Math.min(distance * 0.04, radius * 0.12)) *
        PARALLAX_STRENGTH_MULTIPLIER;
      const strength = baseStrength * (isMobile ? PARALLAX_STRENGTH_MOBILE_MULTIPLIER : 1);

      // 保留当前的视差偏移值
      const currentX = parallaxRef.current?.current.x ?? 0;
      const currentY = parallaxRef.current?.current.y ?? 0;
      const targetX = parallaxRef.current?.target.x ?? 0;
      const targetY = parallaxRef.current?.target.y ?? 0;

      parallaxRef.current = {
        basePosition,
        baseTarget,
        baseRight,
        baseUp,
        strength,
        current: new THREE.Vector2(currentX, currentY),
        target: new THREE.Vector2(targetX, targetY),
      };

      applyCameraProjection();

      console.log("[Parallax] Initialized:", {
        basePosition: basePosition.toArray(),
        baseTarget: baseTarget.toArray(),
        strength,
        depthFocus,
        imageSize: [intrinsics.imageWidth, intrinsics.imageHeight],
      });
    },
    [
      applyCameraProjection,
      stableExtrinsicCv,
      intrinsics.imageWidth,
      intrinsics.imageHeight,
      isMobile,
    ]
  );

  // 初始化视差状态
  const initializeParallax = useCallback(
    (mesh: SparkSplatMesh, cam: THREE.Camera, group: THREE.Group) => {
      meshRefInternal.current = mesh;
      groupRefInternal.current = group;
      doInitializeParallax(mesh, cam, group);
    },
    [doInitializeParallax]
  );

  // 当 cameraMetadata 变化时重新初始化
  useEffect(() => {
    if (splatLoadedRef.current && meshRefInternal.current && groupRefInternal.current) {
      console.log("[Parallax] Re-initializing due to cameraMetadata change");
      doInitializeParallax(meshRefInternal.current, camera, groupRefInternal.current);
    }
  }, [doInitializeParallax, camera]);

  // 更新视差效果
  const updateParallax = useCallback(() => {
    if (!enableParallax || !parallaxRef.current) return;

    const parallax = parallaxRef.current;
    parallax.current.lerp(parallax.target, 0.08);

    const tempPosition = tempPositionRef.current;
    tempPosition.copy(parallax.basePosition);
    tempPosition.addScaledVector(parallax.baseRight, parallax.current.x * parallax.strength);
    tempPosition.addScaledVector(parallax.baseUp, parallax.current.y * parallax.strength);

    camera.position.copy(tempPosition);
    (camera as THREE.Camera).lookAt(parallax.baseTarget);
  }, [camera, enableParallax]);

  return {
    parallaxRef,
    splatLoadedRef,
    frameSize,
    initializeParallax,
    applyCameraProjection,
    updateParallax,
  };
}
