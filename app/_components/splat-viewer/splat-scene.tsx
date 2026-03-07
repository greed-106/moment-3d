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
import { useCameraProjection } from "./use-camera-projection";
import { useCameraReset } from "./use-camera-reset";
import { useRoamCamera } from "./use-roam-camera";

interface SplatSceneProps {
  url: string;
  effect?: EffectType;
  cameraMetadata?: CameraMetadata | null;
  onLoaded?: () => void;
  resetCameraHandler?: { reset?: () => void };
}

const ANIMATION_TIME_MULTIPLIER = { mobile: 2.0, desktop: 1.5 } as const;

export function SplatScene({
  url,
  effect = "None",
  cameraMetadata,
  onLoaded,
  resetCameraHandler,
}: SplatSceneProps) {
  const renderer = useThree((state) => state.gl);
  const { camera, gl, size } = useThree();
  
  const meshRef = useRef<SparkSplatMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  
  const [animateT] = useState(() => dyno.dynoFloat(0));
  const baseTimeRef = useRef(0);
  const [splatDataReady, setSplatDataReady] = useState(false);

  const activeCameraMetadata = cameraMetadata ?? DEFAULT_CAMERA_METADATA;

  // 相机投影
  const { frameSize } = useCameraProjection({
    camera,
    gl,
    size,
    intrinsics: activeCameraMetadata.intrinsics,
  });

  // 相机复位
  const { isResetting, resetCamera, updateResetAnimation, syncOrbitControls } = useCameraReset({
    camera,
    meshRef: meshRef as React.RefObject<SparkSplatMesh>,
    groupRef: groupRef as React.RefObject<THREE.Group>,
    orbitControlsRef: orbitControlsRef as React.RefObject<OrbitControlsImpl>,
    extrinsicCv: activeCameraMetadata.extrinsicCv,
  });

  // 漫游相机初始化
  const { initializedRef, isMobile } = useRoamCamera({
    camera,
    gl,
    size,
    meshRef: meshRef as React.RefObject<SparkSplatMesh>,
    groupRef: groupRef as React.RefObject<THREE.Group>,
    orbitControlsRef: orbitControlsRef as React.RefObject<OrbitControlsImpl>,
    cameraMetadata: activeCameraMetadata,
    frameSize,
    splatDataReady,
    onLoaded,
    syncOrbitControls,
  });

  const timeMultiplier = isMobile 
    ? ANIMATION_TIME_MULTIPLIER.mobile 
    : ANIMATION_TIME_MULTIPLIER.desktop;

  const sparkRendererArgs = useMemo(() => ({ renderer }), [renderer]);

  const handleSplatLoad = useCallback((mesh: SparkSplatMesh) => {
    console.log("[SplatScene] SplatMesh loaded, numSplats:", mesh.packedSplats?.numSplats);
    setSplatDataReady(true);
  }, []);

  const splatMeshArgs = useMemo(
    () => ({ url, onLoad: handleSplatLoad }) as const,
    [url, handleSplatLoad]
  );

  // 设置粒子效果
  const setupSplatModifier = useCallback(() => {
    if (!meshRef.current) return;
    meshRef.current.objectModifier = 
      effect !== "None" ? createSplatEffectModifier(effect, animateT) : undefined;
    meshRef.current.updateGenerator();
  }, [effect, animateT]);

  // 效果变化时更新粒子效果和重置动画时间
  useEffect(() => {
    if (!meshRef.current) return;
    setupSplatModifier();
    baseTimeRef.current = 0;
    animateT.value = 0;
  }, [effect, animateT, setupSplatModifier]);

  // 暴露复位函数给父组件
  useEffect(() => {
    if (resetCameraHandler && splatDataReady) {
      resetCameraHandler.reset = resetCamera;
    }
  }, [resetCameraHandler, resetCamera, splatDataReady]);

  // 每帧更新
  useFrame(() => {
    if (!initializedRef.current || !meshRef.current) return;

    // 相机复位动画
    updateResetAnimation();

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
        enabled
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
