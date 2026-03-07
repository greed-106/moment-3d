"use client";

import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { computeInitialRoamCamera } from "./utils";

const DEFAULT_CAMERA_FORWARD = new THREE.Vector3(0, 0, -1);
const DEFAULT_CAMERA_UP = new THREE.Vector3(0, 1, 0);
const RESET_ANIMATION_SPEED = 0.004;

// easeInOutCubic 缓动函数
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface UseCameraResetOptions {
  camera: THREE.Camera;
  meshRef: React.RefObject<SparkSplatMesh>;
  groupRef: React.RefObject<THREE.Group>;
  orbitControlsRef: React.RefObject<OrbitControlsImpl>;
  extrinsicCv: number[];
}

export function useCameraReset({
  camera,
  meshRef,
  groupRef,
  orbitControlsRef,
  extrinsicCv,
}: UseCameraResetOptions) {
  const [isResetting, setIsResetting] = useState(false);
  const resetStartPosRef = useRef(new THREE.Vector3());
  const resetStartQuatRef = useRef(new THREE.Quaternion());
  const resetTargetPosRef = useRef(new THREE.Vector3());
  const resetTargetQuatRef = useRef(new THREE.Quaternion());
  const resetProgressRef = useRef(0);

  const syncOrbitControls = useCallback(
    (position: THREE.Vector3, quaternion: THREE.Quaternion) => {
      const target = position.clone().add(
        DEFAULT_CAMERA_FORWARD.clone().applyQuaternion(quaternion)
      );
      const up = DEFAULT_CAMERA_UP.clone().applyQuaternion(quaternion).normalize();

      camera.up.copy(up);

      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true;
        orbitControlsRef.current.target.copy(target);
        orbitControlsRef.current.update();
      }
    },
    [camera, orbitControlsRef]
  );

  const resetCamera = useCallback(() => {
    if (!meshRef.current || !groupRef.current || isResetting) return;

    const state = computeInitialRoamCamera(
      meshRef.current,
      groupRef.current,
      extrinsicCv
    );
    if (!state) return;

    // 保存当前和目标相机状态
    resetStartPosRef.current.copy(camera.position);
    resetStartQuatRef.current.copy(camera.quaternion);
    resetTargetPosRef.current.copy(state.position);
    resetTargetQuatRef.current.copy(state.quaternion);

    // 开始动画
    resetProgressRef.current = 0;
    setIsResetting(true);

    // 禁用 OrbitControls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  }, [camera, meshRef, groupRef, orbitControlsRef, extrinsicCv, isResetting]);

  const updateResetAnimation = useCallback(() => {
    if (!isResetting) return false;

    resetProgressRef.current += RESET_ANIMATION_SPEED;
    const t = Math.min(resetProgressRef.current, 1);
    const eased = easeInOutCubic(t);

    // 插值位置和旋转
    camera.position.lerpVectors(
      resetStartPosRef.current,
      resetTargetPosRef.current,
      eased
    );

    camera.quaternion.slerpQuaternions(
      resetStartQuatRef.current,
      resetTargetQuatRef.current,
      eased
    );

    camera.up.copy(
      DEFAULT_CAMERA_UP.clone().applyQuaternion(camera.quaternion).normalize()
    );

    camera.updateMatrix();
    camera.updateMatrixWorld(true);

    // 动画完成
    if (t >= 1) {
      setIsResetting(false);
      syncOrbitControls(resetTargetPosRef.current, resetTargetQuatRef.current);
      return false;
    }

    return true;
  }, [isResetting, camera, syncOrbitControls]);

  return {
    isResetting,
    resetCamera,
    updateResetAnimation,
    syncOrbitControls,
  };
}
