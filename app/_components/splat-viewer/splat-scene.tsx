"use client";

import { SparkRenderer } from "@/app/_components/spark/spark-renderer";
import { SplatMesh } from "@/app/_components/spark/splat-mesh";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { dyno } from "@sparkjsdev/spark";
import * as THREE from "three";
import { createSplatEffectModifier, type EffectType } from "../splat-effects";
import type { CameraMetadata } from "./types";
import { DEFAULT_CAMERA_METADATA } from "./constants";
import { isMobileDevice } from "./utils";
import { useParallaxControls } from "./use-parallax-controls";

interface SplatSceneProps {
  url: string;
  effect?: EffectType;
  enableParallax?: boolean;
  cameraMetadata?: CameraMetadata | null;
  onLoaded?: () => void;
}

// 移动端动画时间倍数
const ANIMATION_TIME_MULTIPLIER = {
  mobile: 2.0,
  desktop: 1.5,
} as const;

export function SplatScene({
  url,
  effect = "None",
  enableParallax = true,
  cameraMetadata,
  onLoaded,
}: SplatSceneProps) {
  const renderer = useThree((state) => state.gl);
  const { camera, gl, size } = useThree();
  const meshRef = useRef<SparkSplatMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [animateT] = useState(() => dyno.dynoFloat(0));
  const baseTimeRef = useRef(0);
  const [splatDataReady, setSplatDataReady] = useState(false);

  const activeCameraMetadata = cameraMetadata ?? DEFAULT_CAMERA_METADATA;
  const isMobile = useMemo(() => isMobileDevice(), []);
  const timeMultiplier = isMobile
    ? ANIMATION_TIME_MULTIPLIER.mobile
    : ANIMATION_TIME_MULTIPLIER.desktop;

  const {
    splatLoadedRef,
    initializeParallax,
    applyCameraProjection,
    updateParallax,
  } = useParallaxControls({
    camera,
    gl,
    size,
    cameraMetadata: activeCameraMetadata,
    enableParallax,
  });

  const sparkRendererArgs = useMemo(() => ({ renderer }), [renderer]);

  const handleSplatLoad = useCallback((mesh: SparkSplatMesh) => {
    console.log(
      "[SplatScene] SplatMesh onLoad triggered, numSplats:",
      mesh.packedSplats?.numSplats
    );
    setSplatDataReady(true);
  }, []);

  const splatMeshArgs = useMemo(
    () => ({ url, onLoad: handleSplatLoad }) as const,
    [url, handleSplatLoad]
  );

  const setupSplatModifier = useCallback(() => {
    if (!meshRef.current) return;

    if (effect !== "None") {
      meshRef.current.objectModifier = createSplatEffectModifier(effect, animateT);
    } else {
      meshRef.current.objectModifier = undefined;
    }
    meshRef.current.updateGenerator();
  }, [effect, animateT]);

  // 初始化：mesh 组件挂载后设置效果
  useEffect(() => {
    if (meshRef.current && groupRef.current) {
      setupSplatModifier();
      splatLoadedRef.current = true;
      baseTimeRef.current = 0;
      onLoaded?.();
    }
  }, [setupSplatModifier, onLoaded, splatLoadedRef]);

  // 当点云数据完全加载后，初始化视差控制
  useEffect(() => {
    if (splatDataReady && enableParallax && meshRef.current && groupRef.current) {
      initializeParallax(meshRef.current, camera, groupRef.current);
    }
  }, [splatDataReady, enableParallax, initializeParallax, camera]);

  // 窗口大小变化时更新投影
  useEffect(() => {
    if (splatLoadedRef.current) {
      applyCameraProjection();
    }
  }, [size, applyCameraProjection, splatLoadedRef]);

  // 效果变化时重置动画
  useEffect(() => {
    baseTimeRef.current = 0;
    animateT.value = 0;
  }, [effect, animateT]);

  // 每帧更新
  useFrame(() => {
    if (!splatLoadedRef.current || !meshRef.current) return;

    updateParallax();

    if (effect !== "None") {
      baseTimeRef.current += (1 / 60) * timeMultiplier;
      animateT.value = baseTimeRef.current;
      meshRef.current.updateVersion();
    }
  });

  return (
    <SparkRenderer args={[sparkRendererArgs]}>
      <group ref={groupRef} rotation={[Math.PI, 0, 0]}>
        <SplatMesh ref={meshRef} args={[splatMeshArgs]} />
      </group>
    </SparkRenderer>
  );
}
