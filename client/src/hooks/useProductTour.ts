/**
 * useProductTour Hook
 * Manages product tour state and first-login detection
 */

import { useState, useEffect } from "react";
import {
  hasCompletedTour,
  markTourAsCompleted,
  isFirstLogin,
  resetTour,
} from "@/lib/tourSteps";

export function useProductTour() {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the user's first login and they haven't completed the tour
    const firstLogin = isFirstLogin();
    const tourCompleted = hasCompletedTour();

    if (firstLogin && !tourCompleted) {
      setShowTour(true);
    }

    setIsLoading(false);
  }, []);

  const handleTourComplete = () => {
    markTourAsCompleted();
    setShowTour(false);
  };

  const handleTourSkip = () => {
    markTourAsCompleted();
    setShowTour(false);
  };

  const restartTour = () => {
    resetTour();
    setShowTour(true);
  };

  return {
    showTour,
    isLoading,
    handleTourComplete,
    handleTourSkip,
    restartTour,
  };
}
