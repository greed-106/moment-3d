"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { DragState, ParallaxState } from "./types";
import { DRAG_SENSITIVITY_PC, DRAG_SENSITIVITY_MOBILE } from "./constants";

interface UseDragControlsOptions {
  gl: THREE.WebGLRenderer;
  parallaxRef: React.MutableRefObject<ParallaxState | null>;
  enabled: boolean;
  isMobile: boolean;
}

export function useDragControls({
  gl,
  parallaxRef,
  enabled,
  isMobile,
}: UseDragControlsOptions) {
  const dragStartRef = useRef<DragState | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = gl.domElement;
    const container = canvas.parentElement;
    if (!container) return;

    const sensitivity = isMobile ? DRAG_SENSITIVITY_MOBILE : DRAG_SENSITIVITY_PC;

    const handleStart = (clientX: number, clientY: number) => {
      const currentTarget = parallaxRef.current?.target;
      dragStartRef.current = {
        mouseX: clientX,
        mouseY: clientY,
        parallaxX: currentTarget?.x ?? 0,
        parallaxY: currentTarget?.y ?? 0,
      };
    };

    const handleEnd = () => {
      dragStartRef.current = null;
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!dragStartRef.current) return;

      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaX = ((clientX - dragStartRef.current.mouseX) / rect.width) * 2 * sensitivity;
      const deltaY = -((clientY - dragStartRef.current.mouseY) / rect.height) * 2 * sensitivity;

      const newX = THREE.MathUtils.clamp(
        dragStartRef.current.parallaxX + deltaX,
        -1,
        1
      );
      const newY = THREE.MathUtils.clamp(
        dragStartRef.current.parallaxY + deltaY,
        -1,
        1
      );

      if (parallaxRef.current) {
        parallaxRef.current.target.set(newX, newY);
      }
    };

    if (isMobile) {
      // 移动端触摸事件
      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 1) {
          const touch = event.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (event.touches.length === 1) {
          const touch = event.touches[0];
          handleMove(touch.clientX, touch.clientY);
          event.preventDefault();
        }
      };

      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchend", handleEnd, { passive: true });
      container.addEventListener("touchcancel", handleEnd, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: false });

      return () => {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleEnd);
        container.removeEventListener("touchcancel", handleEnd);
        container.removeEventListener("touchmove", handleTouchMove);
      };
    } else {
      // PC 端鼠标事件
      const handleMouseDown = (event: MouseEvent) => {
        if (event.button === 0) {
          handleStart(event.clientX, event.clientY);
        }
      };

      const handleMouseMove = (event: MouseEvent) => {
        handleMove(event.clientX, event.clientY);
      };

      const handleLeave = () => {
        dragStartRef.current = null;
      };

      container.addEventListener("mousedown", handleMouseDown);
      container.addEventListener("mouseup", handleEnd);
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleLeave);
      window.addEventListener("mouseup", handleEnd);

      return () => {
        container.removeEventListener("mousedown", handleMouseDown);
        container.removeEventListener("mouseup", handleEnd);
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleLeave);
        window.removeEventListener("mouseup", handleEnd);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
