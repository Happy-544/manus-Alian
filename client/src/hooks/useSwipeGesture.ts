import { useEffect, useRef, useState } from "react";

export interface SwipeGestureConfig {
  minDistance?: number; // Minimum distance to trigger swipe (default: 50)
  maxDuration?: number; // Maximum duration for swipe in ms (default: 500)
  velocityThreshold?: number; // Velocity threshold for fast swipes (default: 0.5 px/ms)
  onSwipeLeft?: (velocity?: number) => void;
  onSwipeRight?: (velocity?: number) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: (velocity?: number) => void;
  onFastSwipeLeft?: () => void; // High-velocity swipe left
  onFastSwipeRight?: () => void; // High-velocity swipe right
}

export interface SwipeState {
  isDragging: boolean;
  dragX: number;
  dragY: number;
  startX: number;
  startY: number;
  velocity: number; // Pixels per millisecond
  isFastSwipe: boolean; // Whether swipe exceeds velocity threshold
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
    velocityThreshold = 0.5,
    onSwipeLeft,
    onSwipeRight,
    onSwipeStart,
    onSwipeEnd,
    onFastSwipeLeft,
    onFastSwipeRight,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    dragX: 0,
    dragY: 0,
    startX: 0,
    startY: 0,
    velocity: 0,
    isFastSwipe: false,
  });

  const touchStartRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const lastTouchXRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!element?.current) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = Date.now();
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
      lastTouchXRef.current = touch.clientX;
      lastTouchTimeRef.current = Date.now();

      setSwipeState((prev) => ({
        ...prev,
        isDragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        dragX: 0,
        dragY: 0,
        velocity: 0,
        isFastSwipe: false,
      }));

      onSwipeStart?.();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!swipeState.isDragging) return;

      const touch = e.touches[0];
      const dragX = touch.clientX - touchStartXRef.current;
      const dragY = touch.clientY - touchStartYRef.current;

      // Calculate instantaneous velocity
      const timeDelta = Date.now() - lastTouchTimeRef.current;
      const distanceDelta = Math.abs(touch.clientX - lastTouchXRef.current);
      const instantVelocity = timeDelta > 0 ? distanceDelta / timeDelta : 0;

      lastTouchXRef.current = touch.clientX;
      lastTouchTimeRef.current = Date.now();

      setSwipeState((prev) => ({
        ...prev,
        dragX,
        dragY,
        velocity: instantVelocity,
        isFastSwipe: instantVelocity > velocityThreshold,
      }));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const duration = Date.now() - touchStartRef.current;
      const dragX = swipeState.dragX;
      const dragY = swipeState.dragY;
      const velocity = swipeState.velocity;
      const isFastSwipe = swipeState.isFastSwipe;

      // Check if it's a valid swipe
      const isValidSwipe =
        Math.abs(dragX) > minDistance &&
        Math.abs(dragX) > Math.abs(dragY) &&
        duration < maxDuration;

      if (isValidSwipe) {
        if (dragX > 0) {
          // Swiped right
          if (isFastSwipe) {
            onFastSwipeRight?.();
          } else {
            onSwipeRight?.(velocity);
          }
        } else {
          // Swiped left
          if (isFastSwipe) {
            onFastSwipeLeft?.();
          } else {
            onSwipeLeft?.(velocity);
          }
        }
      }

      setSwipeState((prev) => ({
        ...prev,
        isDragging: false,
        dragX: 0,
        dragY: 0,
        velocity: 0,
        isFastSwipe: false,
      }));

      onSwipeEnd?.(velocity);
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
  }, [swipeState.isDragging, minDistance, maxDuration, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeStart, onSwipeEnd, onFastSwipeLeft, onFastSwipeRight]);

  return swipeState;
}
