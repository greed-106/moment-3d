"use client";

import { useCallback, useMemo } from "react";
import * as THREE from "three";
import type { CameraIntrinsics } from "./types";
import { makeProjectionFromIntrinsics } from "./utils";

interface UseCameraProjectionOptions {
  camera: THREE.Camera;
  gl: THREE.WebGLRenderer;
  size: { width: number; height: number };
  intrinsics: CameraIntrinsics;
}

export function useCameraProjection({
  camera,
  gl,
  size,
  intrinsics,
}: UseCameraProjectionOptions) {
  // 计算画框尺寸
  const frameSize = useMemo(() => {
    const imageAspect = intrinsics.imageWidth / intrinsics.imageHeight;
    const containerAspect = size.width / size.height;

    if (containerAspect > imageAspect) {
      const height = size.height;
      const width = height * imageAspect;
      return { width, height };
    } else {
      const width = size.width;
      const height = width / imageAspect;
      return { width, height };
    }
  }, [size.width, size.height, intrinsics.imageWidth, intrinsics.imageHeight]);

  // 应用相机内参投影
  const applyCameraProjection = useCallback(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const { fx, fy, cx, cy, imageWidth, imageHeight } = intrinsics;
    const near = 0.01;
    const far = 100;

    const sx = frameSize.width / imageWidth;
    const sy = frameSize.height / imageHeight;
    const s = Math.min(sx, sy);

    const scaledWidth = imageWidth * s;
    const scaledHeight = imageHeight * s;

    const offsetX = (frameSize.width - scaledWidth) * 0.5;
    const offsetY = (frameSize.height - scaledHeight) * 0.5;

    const scaledFx = fx * s;
    const scaledFy = fy * s;
    const scaledCx = cx * s + offsetX;
    const scaledCy = cy * s + offsetY;

    const projection = makeProjectionFromIntrinsics({
      fx: scaledFx,
      fy: scaledFy,
      cx: scaledCx,
      cy: scaledCy,
      width: frameSize.width,
      height: frameSize.height,
      near,
      far,
    });

    camera.projectionMatrix.copy(projection);
    camera.projectionMatrixInverse.copy(projection).invert();

    const viewportX = (size.width - frameSize.width) / 2;
    const viewportY = (size.height - frameSize.height) / 2;
    gl.setViewport(viewportX, viewportY, frameSize.width, frameSize.height);
    gl.setScissor(viewportX, viewportY, frameSize.width, frameSize.height);
    gl.setScissorTest(true);
  }, [
    camera,
    gl,
    size.width,
    size.height,
    frameSize.width,
    frameSize.height,
    intrinsics.fx,
    intrinsics.fy,
    intrinsics.cx,
    intrinsics.cy,
    intrinsics.imageWidth,
    intrinsics.imageHeight,
  ]);

  return {
    frameSize,
    applyCameraProjection,
  };
}
