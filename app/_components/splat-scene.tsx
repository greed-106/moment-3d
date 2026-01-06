"use client";

import { SparkRenderer } from "@/app/_components/spark/spark-renderer";
import { SplatMesh } from "@/app/_components/spark/splat-mesh";
import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { dyno } from "@sparkjsdev/spark";
import {
  createSplatEffectModifier,
  type EffectType,
} from "./splat-effects";

interface SplatSceneProps {
  url: string;
  effect?: EffectType;
  autoRotate?: boolean;
}

export function SplatScene({
  url,
  effect = "None",
  autoRotate = false,
}: SplatSceneProps) {
  const renderer = useThree((state) => state.gl);
  const meshRef = useRef<SparkSplatMesh>(null);
  const [animateT] = useState(() => dyno.dynoFloat(0));
  const baseTimeRef = useRef(0);
  const splatLoadedRef = useRef(false);

  const sparkRendererArgs = useMemo(() => {
    return { renderer };
  }, [renderer]);

  const splatMeshArgs = useMemo(
    () =>
      ({
        url,
      }) as const,
    [url]
  );

  // Setup splat modifier with effects
  const setupSplatModifier = useCallback(() => {
    if (!meshRef.current) return;

    // 只有当效果不是None时才应用修改器
    if (effect !== "None") {
      meshRef.current.objectModifier = createSplatEffectModifier(
        effect,
        animateT
      );
    } else {
      // None效果时移除修改器
      meshRef.current.objectModifier = undefined;
    }
    meshRef.current.updateGenerator();
  }, [effect, animateT]);

  // Setup effect when mesh is ready
  useEffect(() => {
    if (meshRef.current) {
      setupSplatModifier();
      splatLoadedRef.current = true;
      baseTimeRef.current = 0;
    }
  }, [setupSplatModifier]);

  // Reset animation when effect changes
  useEffect(() => {
    baseTimeRef.current = 0;
    animateT.value = 0;
  }, [effect, animateT]);

  // Update animation time each frame
  useFrame((_, delta) => {
    if (splatLoadedRef.current && meshRef.current) {
      // 自动旋转
      if (autoRotate) {
        meshRef.current.rotation.y += 0.1 * delta;
      }

      // 只有非None效果才更新动画时间
      if (effect !== "None") {
        baseTimeRef.current += 1 / 60;
        animateT.value = baseTimeRef.current;
        meshRef.current.updateVersion();
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 1]} />
      <CameraControls maxDistance={3} />
      <SparkRenderer args={[sparkRendererArgs]}>
        <group rotation={[Math.PI, 0, 0]}>
          <SplatMesh ref={meshRef} args={[splatMeshArgs]} />
        </group>
      </SparkRenderer>
    </>
  );
}
