"use client";

import { SparkRenderer } from "@/app/_components/spark/spark-renderer";
import { SplatMesh } from "@/app/_components/spark/splat-mesh";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { dyno } from "@sparkjsdev/spark";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { createSplatEffectModifier, type EffectType } from "../splat-effects";
import type { CameraMetadata } from "./types";
import { DEFAULT_CAMERA_METADATA } from "./constants";
import { isMobileDevice, computePhotoModeCamera, computeRoamModeFov, type PhotoModeCameraState } from "./utils";
import { useParallaxControls } from "./use-parallax-controls";
import { useCameraTransition } from "./use-camera-transition";

export type ViewMode = "photo" | "roam";

interface SplatSceneProps {
  url: string;
  effect?: EffectType;
  viewMode?: ViewMode;
  cameraMetadata?: CameraMetadata | null;
  onLoaded?: () => void;
}

// 动画时间倍数
const ANIMATION_TIME_MULTIPLIER = { mobile: 2.0, desktop: 1.5 } as const;

export function SplatScene({
  url,
  effect = "None",
  viewMode = "photo",
  cameraMetadata,
  onLoaded,
}: SplatSceneProps) {
  const renderer = useThree((state) => state.gl);
  const { camera, gl, size } = useThree();
  const meshRef = useRef<SparkSplatMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const [animateT] = useState(() => dyno.dynoFloat(0));
  const baseTimeRef = useRef(0);
  const [splatDataReady, setSplatDataReady] = useState(false);
  const photoModeStateRef = useRef<PhotoModeCameraState | null>(null);
  const prevViewModeRef = useRef(viewMode);
  const initializedRef = useRef(false);

  const activeCameraMetadata = cameraMetadata ?? DEFAULT_CAMERA_METADATA;
  const isMobile = useMemo(() => isMobileDevice(), []);
  const timeMultiplier = isMobile ? ANIMATION_TIME_MULTIPLIER.mobile : ANIMATION_TIME_MULTIPLIER.desktop;

  // 视差控制
  const {
    splatLoadedRef,
    frameSize,
    initializeParallax,
    applyCameraProjection,
    updateParallax,
  } = useParallaxControls({
    camera,
    gl,
    size,
    cameraMetadata: activeCameraMetadata,
    enableParallax: viewMode === "photo",
  });

  // 相机过渡动画
  const handleTransitionComplete = useCallback(() => {
    if (viewMode === "photo" && meshRef.current && groupRef.current) {
      initializeParallax(meshRef.current, camera, groupRef.current, true);
      applyCameraProjection();
    }
  }, [viewMode, camera, initializeParallax, applyCameraProjection]);

  const { startTransition, stopTransition, updateTransition } = useCameraTransition({
    camera,
    onTransitionComplete: handleTransitionComplete,
  });


  // 计算当前的漫游模式 FOV
  const roamFov = useMemo(
    () => computeRoamModeFov(activeCameraMetadata.intrinsics, frameSize, size.height),
    [activeCameraMetadata.intrinsics, frameSize, size.height]
  );

  const sparkRendererArgs = useMemo(() => ({ renderer }), [renderer]);

  const handleSplatLoad = useCallback((mesh: SparkSplatMesh) => {
    console.log("[SplatScene] SplatMesh onLoad triggered, numSplats:", mesh.packedSplats?.numSplats);
    setSplatDataReady(true);
  }, []);

  const splatMeshArgs = useMemo(() => ({ url, onLoad: handleSplatLoad }) as const, [url, handleSplatLoad]);

  // 设置粒子效果
  const setupSplatModifier = useCallback(() => {
    if (!meshRef.current) return;
    meshRef.current.objectModifier = effect !== "None" ? createSplatEffectModifier(effect, animateT) : undefined;
    meshRef.current.updateGenerator();
  }, [effect, animateT]);

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

  // 初始化：mesh 组件挂载后设置效果
  useEffect(() => {
    if (meshRef.current && groupRef.current) {
      setupSplatModifier();
      splatLoadedRef.current = true;
      baseTimeRef.current = 0;
      onLoaded?.();
    }
  }, [setupSplatModifier, onLoaded, splatLoadedRef]);

  // 首次加载完成后初始化视差控制
  useEffect(() => {
    if (splatDataReady && viewMode === "photo" && meshRef.current && groupRef.current && !initializedRef.current) {
      initializedRef.current = true;
      initializeParallax(meshRef.current, camera, groupRef.current);
      const state = computePhotoModeCamera(meshRef.current, groupRef.current, activeCameraMetadata.extrinsicCv);
      if (state) photoModeStateRef.current = state;
    }
  }, [splatDataReady, viewMode, initializeParallax, camera, activeCameraMetadata.extrinsicCv]);

  // 模式切换处理
  useEffect(() => {
    if (!splatDataReady || !meshRef.current || !groupRef.current) return;
    if (prevViewModeRef.current === viewMode) return;
    prevViewModeRef.current = viewMode;

    if (viewMode === "photo") {
      // 切换到照片模式
      if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
      const targetState = computePhotoModeCamera(meshRef.current, groupRef.current, activeCameraMetadata.extrinsicCv);
      if (targetState) {
        photoModeStateRef.current = targetState;
        startTransition(targetState.position, targetState.quaternion, targetState.target);
      }
    } else {
      // 切换到漫游模式
      stopTransition();
      if (orbitControlsRef.current && photoModeStateRef.current) {
        orbitControlsRef.current.enabled = true;
        orbitControlsRef.current.target.copy(photoModeStateRef.current.target);
        orbitControlsRef.current.update();
      }
      applyRoamModeCamera();
    }
  }, [viewMode, splatDataReady, activeCameraMetadata.extrinsicCv, startTransition, stopTransition, applyRoamModeCamera]);

  // 窗口大小变化时更新投影
  useEffect(() => {
    if (!splatLoadedRef.current) return;
    if (viewMode === "photo") {
      applyCameraProjection();
    } else {
      applyRoamModeCamera();
    }
  }, [size, applyCameraProjection, splatLoadedRef, viewMode, applyRoamModeCamera]);

  // 效果变化时重置动画
  useEffect(() => {
    baseTimeRef.current = 0;
    animateT.value = 0;
  }, [effect, animateT]);

  // 每帧更新
  useFrame(() => {
    if (!splatLoadedRef.current || !meshRef.current) return;

    // 处理相机过渡动画或视差效果
    const isTransitioning = updateTransition();
    if (!isTransitioning && viewMode === "photo") {
      updateParallax();
    }

    // 更新粒子效果动画
    if (effect !== "None") {
      baseTimeRef.current += (1 / 60) * timeMultiplier;
      animateT.value = baseTimeRef.current;
      meshRef.current.updateVersion();
    }
  });

  return (
    <>
      <SparkRenderer args={[sparkRendererArgs]}>
        <group ref={groupRef} rotation={[Math.PI, 0, 0]}>
          <SplatMesh ref={meshRef} args={[splatMeshArgs]} />
        </group>
      </SparkRenderer>
      <OrbitControls
        ref={orbitControlsRef}
        enabled={viewMode === "roam"}
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        panSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={0.1}
        maxDistance={10}
      />
    </>
  );
}
