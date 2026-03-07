"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { computeInitialRoamCamera, computeRoamModeFov, isMobileDevice } from "./utils";
import type { CameraMetadata } from "./types";

interface UseRoamCameraOptions {
  camera: THREE.Camera;
  gl: THREE.WebGLRenderer;
  size: { width: number; height: number };
  meshRef: React.RefObject<SparkSplatMesh>;
  groupRef: React.RefObject<THREE.Group>;
  orbitControlsRef: React.RefObject<OrbitControlsImpl>;
  cameraMetadata: CameraMetadata;
  frameSize: { width: number; height: number };
  splatDataReady: boolean;
  onLoaded?: () => void;
  syncOrbitControls: (position: THREE.Vector3, quaternion: THREE.Quaternion) => void;
}

export function useRoamCamera({
  camera,
  gl,
  size,
  meshRef,
  groupRef,
  orbitControlsRef,
  cameraMetadata,
  frameSize,
  splatDataReady,
  onLoaded,
  syncOrbitControls,
}: UseRoamCameraOptions) {
  const initializedRef = useRef(false);
  const isMobile = useMemo(() => isMobileDevice(), []);

  // 计算漫游模式 FOV
  const roamFov = useMemo(
    () => computeRoamModeFov(cameraMetadata.intrinsics, frameSize, size.height),
    [cameraMetadata.intrinsics, frameSize, size.height]
  );

  // 应用漫游模式的相机设置
  const applyRoamModeCamera = useCallback(() => {
    gl.setViewport(0, 0, size.width, size.height);
    gl.setScissor(0, 0, size.width, size.height);
    gl.setScissorTest(false);
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = roamFov;
      camera.aspect = size.width / size.height;
      camera.near = 0.01;
      camera.far = 100;
      camera.updateProjectionMatrix();
    }
  }, [gl, size, camera, roamFov]);

  // 初始化漫游相机
  const initializeRoamCamera = useCallback(() => {
    if (!meshRef.current || !groupRef.current) return;

    const state = computeInitialRoamCamera(
      meshRef.current,
      groupRef.current,
      cameraMetadata.extrinsicCv
    );
    if (!state) return;

    camera.position.copy(state.position);
    camera.quaternion.copy(state.quaternion);
    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    syncOrbitControls(state.position, state.quaternion);
    applyRoamModeCamera();
  }, [
    meshRef,
    groupRef,
    cameraMetadata.extrinsicCv,
    camera,
    syncOrbitControls,
    applyRoamModeCamera,
  ]);

  // 首次加载完成后初始化漫游相机（只执行一次）
  useEffect(() => {
    if (splatDataReady && meshRef.current && groupRef.current && !initializedRef.current) {
      initializedRef.current = true;
      initializeRoamCamera();
      onLoaded?.();
    }
  }, [splatDataReady, initializeRoamCamera, onLoaded, meshRef, groupRef]);

  // 窗口大小变化时更新漫游相机投影
  useEffect(() => {
    if (!initializedRef.current) return;
    applyRoamModeCamera();
  }, [size, applyRoamModeCamera]);

  return {
    initializedRef,
    isMobile,
  };
}
