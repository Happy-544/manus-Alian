import { useEffect, useRef, useState } from "react";

export interface SwipeGestureConfig {
  minDistance?: number; // Minimum distance to trigger swipe (default: 50)
  maxDuration?: number; // Maximum duration for swipe in ms (default: 500)
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export interface SwipeState {
  isDragging: boolean;
  dragX: number;
  dragY: number;
  startX: number;
  startY: number;
}

/**
 * Custom hook for detecting swipe gestures
 * Detects left/right swipes with configurable thresholds
 */
export function useSwipeGesture(
  element: React.RefObject<HTMLElement> | null,
  config: SwipeGestureConfig = {}
) {
  const {
    minDistance = 50,
    maxDuration = 500,
    onSwipeLeft,
    onSwipeRight,
    onSwipeStart,
    onSwipeEnd,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    dragX: 0,
    dragY: 0,
    startX: 0,
    startY: 0,
  });

  const touchStartRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  useEffect(() => {
    if (!element?.current) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = Date.now();
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;

      setSwipeState((prev) => ({
        ...prev,
        isDragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        dragX: 0,
        dragY: 0,
      }));

      onSwipeStart?.();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!swipeState.isDragging) return;

      const touch = e.touches[0];
      const dragX = touch.clientX - touchStartXRef.current;
      const dragY = touch.clientY - touchStartYRef.current;

      setSwipeState((prev) => ({
        ...prev,
        dragX,
        dragY,
      }));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const duration = Date.now() - touchStartRef.current;
      const dragX = swipeState.dragX;
      const dragY = swipeState.dragY;

      // Check if it's a valid swipe
      const isValidSwipe =
        Math.abs(dragX) > minDistance &&
        Math.abs(dragX) > Math.abs(dragY) &&
        duration < maxDuration;

      if (isValidSwipe) {
        if (dragX > 0) {
          // Swiped right
          onSwipeRight?.();
        } else {
          // Swiped left
          onSwipeLeft?.();
        }
      }

      setSwipeState((prev) => ({
        ...prev,
        isDragging: false,
        dragX: 0,
        dragY: 0,
      }));

      onSwipeEnd?.();
    };

    const target = element.current;
    target.addEventListener("touchstart", handleTouchStart, false);
    target.addEventListener("touchmove", handleTouchMove, false);
    target.addEventListener("touchend", handleTouchEnd, false);

    return () => {
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
    };
  }, [swipeState.isDragging, minDistance, maxDuration, onSwipeLeft, onSwipeRight, onSwipeStart, onSwipeEnd]);

  return swipeState;
}
