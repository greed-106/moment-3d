"use client";

import { useCallback, useRef } from "react";
import * as THREE from "three";

// 相机过渡动画时长（秒）
const CAMERA_TRANSITION_DURATION = 1.0;

interface TransitionState {
  active: boolean;
  startTime: number;
  startPosition: THREE.Vector3;
  startQuaternion: THREE.Quaternion;
  targetPosition: THREE.Vector3;
  targetQuaternion: THREE.Quaternion;
  targetLookAt: THREE.Vector3;
}

interface UseCameraTransitionOptions {
  camera: THREE.Camera;
  onTransitionComplete?: () => void;
}

export function useCameraTransition({ camera, onTransitionComplete }: UseCameraTransitionOptions) {
  const transitionRef = useRef<TransitionState | null>(null);

  // 启动相机过渡动画
  const startTransition = useCallback(
    (targetPosition: THREE.Vector3, targetQuaternion: THREE.Quaternion, targetLookAt: THREE.Vector3) => {
      transitionRef.current = {
        active: true,
        startTime: performance.now() / 1000,
        startPosition: camera.position.clone(),
        startQuaternion: camera.quaternion.clone(),
        targetPosition,
        targetQuaternion,
        targetLookAt,
      };
    },
    [camera]
  );

  // 停止过渡动画
  const stopTransition = useCallback(() => {
    transitionRef.current = null;
  }, []);

  // 每帧更新过渡动画，返回是否仍在过渡中
  const updateTransition = useCallback(() => {
    if (!transitionRef.current?.active) return false;

    const t = transitionRef.current;
    const elapsed = performance.now() / 1000 - t.startTime;
    const progress = Math.min(elapsed / CAMERA_TRANSITION_DURATION, 1);

    // 使用 ease-out 缓动
    const eased = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(t.startPosition, t.targetPosition, eased);
    camera.quaternion.slerpQuaternions(t.startQuaternion, t.targetQuaternion, eased);

    if (progress >= 1) {
      transitionRef.current.active = false;
      onTransitionComplete?.();
      return false;
    }

    return true;
  }, [camera, onTransitionComplete]);

  // 检查是否正在过渡中
  const isTransitioning = useCallback(() => {
    return transitionRef.current?.active ?? false;
  }, []);

  return {
    startTransition,
    stopTransition,
    updateTransition,
    isTransitioning,
  };
}
