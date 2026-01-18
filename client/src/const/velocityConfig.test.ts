import { describe, it, expect } from "vitest";
import {
  VELOCITY_CONFIG,
  getNavigationSteps,
  getAnimationDuration,
  getHapticPattern,
  isFastSwipe,
  getAnimationClass,
} from "./velocityConfig";

describe("Velocity Configuration", () => {
  describe("VELOCITY_CONFIG constants", () => {
    it("should have correct velocity thresholds", () => {
      expect(VELOCITY_CONFIG.VELOCITY_THRESHOLD).toBe(0.5);
      expect(VELOCITY_CONFIG.FAST_SWIPE_THRESHOLD).toBe(1.0);
      expect(VELOCITY_CONFIG.VERY_FAST_SWIPE_THRESHOLD).toBe(1.5);
    });

    it("should have correct navigation steps", () => {
      expect(VELOCITY_CONFIG.NAVIGATION_STEPS.SLOW).toBe(1);
      expect(VELOCITY_CONFIG.NAVIGATION_STEPS.MEDIUM).toBe(2);
      expect(VELOCITY_CONFIG.NAVIGATION_STEPS.FAST).toBe(3);
    });

    it("should have correct animation durations", () => {
      expect(VELOCITY_CONFIG.ANIMATION_DURATION.NORMAL).toBe(300);
      expect(VELOCITY_CONFIG.ANIMATION_DURATION.FAST).toBe(200);
      expect(VELOCITY_CONFIG.ANIMATION_DURATION.MOMENTUM).toBe(200);
    });

    it("should have correct touch config", () => {
      expect(VELOCITY_CONFIG.TOUCH_CONFIG.MIN_DISTANCE).toBe(30);
      expect(VELOCITY_CONFIG.TOUCH_CONFIG.MAX_DURATION).toBe(500);
    });
  });

  describe("getNavigationSteps", () => {
    it("should return 1 step for undefined velocity", () => {
      expect(getNavigationSteps()).toBe(1);
    });

    it("should return 1 step for low velocity", () => {
      expect(getNavigationSteps(0.3)).toBe(1);
      expect(getNavigationSteps(0.8)).toBe(1);
    });

    it("should return 2 steps for medium velocity", () => {
      expect(getNavigationSteps(1.0)).toBe(2);
      expect(getNavigationSteps(1.2)).toBe(2);
    });

    it("should return 3 steps for high velocity", () => {
      expect(getNavigationSteps(1.5)).toBe(3);
      expect(getNavigationSteps(2.0)).toBe(3);
    });
  });

  describe("getAnimationDuration", () => {
    it("should return normal duration for undefined velocity", () => {
      expect(getAnimationDuration()).toBe(300);
    });

    it("should return normal duration for low velocity", () => {
      expect(getAnimationDuration(0.5)).toBe(300);
    });

    it("should return fast duration for high velocity", () => {
      expect(getAnimationDuration(1.0)).toBe(200);
      expect(getAnimationDuration(1.5)).toBe(200);
    });
  });

  describe("getHapticPattern", () => {
    it("should return normal pattern for undefined velocity", () => {
      expect(getHapticPattern()).toBe(10);
    });

    it("should return normal pattern for low velocity", () => {
      expect(getHapticPattern(0.5)).toBe(10);
    });

    it("should return strong pattern for medium velocity", () => {
      expect(getHapticPattern(1.2)).toBe(15);
    });

    it("should return fast pattern for fast swipe", () => {
      expect(getHapticPattern(0.5, true)).toEqual([10, 50, 10]);
    });

    it("should return fast pattern over strong pattern", () => {
      expect(getHapticPattern(1.5, true)).toEqual([10, 50, 10]);
    });
  });

  describe("isFastSwipe", () => {
    it("should return false for undefined velocity", () => {
      expect(isFastSwipe()).toBe(false);
    });

    it("should return false for low velocity", () => {
      expect(isFastSwipe(0.5)).toBe(false);
      expect(isFastSwipe(0.9)).toBe(false);
    });

    it("should return true for velocity at threshold", () => {
      expect(isFastSwipe(1.0)).toBe(true);
    });

    it("should return true for high velocity", () => {
      expect(isFastSwipe(1.5)).toBe(true);
      expect(isFastSwipe(2.0)).toBe(true);
    });
  });

  describe("getAnimationClass", () => {
    it("should return page animation for left direction with low velocity", () => {
      expect(getAnimationClass("left", 0.5)).toBe("page-enter-from-left");
    });

    it("should return page animation for right direction with low velocity", () => {
      expect(getAnimationClass("right", 0.5)).toBe("page-enter-from-right");
    });

    it("should return momentum animation for left direction with high velocity", () => {
      expect(getAnimationClass("left", 1.0)).toBe("momentum-enter-from-left");
    });

    it("should return momentum animation for right direction with high velocity", () => {
      expect(getAnimationClass("right", 1.5)).toBe("momentum-enter-from-right");
    });

    it("should return page animation for undefined velocity", () => {
      expect(getAnimationClass("left")).toBe("page-enter-from-left");
      expect(getAnimationClass("right")).toBe("page-enter-from-right");
    });
  });
});
