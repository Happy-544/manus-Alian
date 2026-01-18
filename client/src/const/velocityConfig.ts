/**
 * Velocity Detection Configuration
 * Configurable thresholds and parameters for swipe gesture velocity detection
 */

export const VELOCITY_CONFIG = {
  // Velocity thresholds (pixels per millisecond)
  VELOCITY_THRESHOLD: 0.5, // Minimum velocity to trigger fast swipe
  FAST_SWIPE_THRESHOLD: 1.0, // Velocity threshold for fast navigation
  VERY_FAST_SWIPE_THRESHOLD: 1.5, // Velocity threshold for multi-step navigation

  // Navigation steps based on velocity
  NAVIGATION_STEPS: {
    SLOW: 1, // 0.5-1.0 px/ms
    MEDIUM: 2, // 1.0-1.5 px/ms
    FAST: 3, // 1.5+ px/ms
  },

  // Animation timings (milliseconds)
  ANIMATION_DURATION: {
    NORMAL: 300, // Normal swipe animation
    FAST: 200, // Fast swipe animation
    MOMENTUM: 200, // Momentum animation
  },

  // Haptic feedback patterns (milliseconds)
  HAPTIC_PATTERNS: {
    NORMAL: 10, // Single tap
    STRONG: 15, // Stronger feedback
    FAST: [10, 50, 10], // Double tap pattern
  },

  // Touch detection parameters
  TOUCH_CONFIG: {
    MIN_DISTANCE: 30, // Minimum swipe distance in pixels
    MAX_DURATION: 500, // Maximum swipe duration in milliseconds
  },

  // Velocity calculation smoothing
  VELOCITY_SMOOTHING: 0.8, // Exponential moving average factor
};

/**
 * Calculate navigation steps based on velocity
 * @param velocity - Velocity in pixels per millisecond
 * @returns Number of navigation steps to take
 */
export function getNavigationSteps(velocity?: number): number {
  if (!velocity) return VELOCITY_CONFIG.NAVIGATION_STEPS.SLOW;
  if (velocity >= VELOCITY_CONFIG.VERY_FAST_SWIPE_THRESHOLD)
    return VELOCITY_CONFIG.NAVIGATION_STEPS.FAST;
  if (velocity >= VELOCITY_CONFIG.FAST_SWIPE_THRESHOLD)
    return VELOCITY_CONFIG.NAVIGATION_STEPS.MEDIUM;
  return VELOCITY_CONFIG.NAVIGATION_STEPS.SLOW;
}

/**
 * Get animation duration based on velocity
 * @param velocity - Velocity in pixels per millisecond
 * @returns Animation duration in milliseconds
 */
export function getAnimationDuration(velocity?: number): number {
  if (!velocity) return VELOCITY_CONFIG.ANIMATION_DURATION.NORMAL;
  if (velocity >= VELOCITY_CONFIG.FAST_SWIPE_THRESHOLD)
    return VELOCITY_CONFIG.ANIMATION_DURATION.FAST;
  return VELOCITY_CONFIG.ANIMATION_DURATION.NORMAL;
}

/**
 * Get haptic feedback pattern based on velocity
 * @param velocity - Velocity in pixels per millisecond
 * @param isFast - Whether this is a fast swipe
 * @returns Haptic pattern (number or array of numbers)
 */
export function getHapticPattern(
  velocity?: number,
  isFast?: boolean
): number | number[] {
  if (isFast) return VELOCITY_CONFIG.HAPTIC_PATTERNS.FAST;
  if (velocity && velocity > VELOCITY_CONFIG.FAST_SWIPE_THRESHOLD)
    return VELOCITY_CONFIG.HAPTIC_PATTERNS.STRONG;
  return VELOCITY_CONFIG.HAPTIC_PATTERNS.NORMAL;
}

/**
 * Determine if swipe is considered "fast" based on velocity
 * @param velocity - Velocity in pixels per millisecond
 * @returns Boolean indicating if swipe is fast
 */
export function isFastSwipe(velocity?: number): boolean {
  return velocity ? velocity >= VELOCITY_CONFIG.FAST_SWIPE_THRESHOLD : false;
}

/**
 * Get animation class name based on velocity and direction
 * @param direction - Swipe direction ('left' or 'right')
 * @param velocity - Velocity in pixels per millisecond
 * @returns CSS class name for animation
 */
export function getAnimationClass(
  direction: "left" | "right",
  velocity?: number
): string {
  const isFast = velocity && velocity >= VELOCITY_CONFIG.FAST_SWIPE_THRESHOLD;
  const prefix = isFast ? "momentum" : "page";
  const suffix = direction === "left" ? "enter-from-left" : "enter-from-right";
  return `${prefix}-${suffix}`;
}
