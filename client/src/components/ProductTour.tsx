/**
 * ProductTour Component
 * Interactive guided tour highlighting key platform features
 */

import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, X, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position?: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

interface ProductTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

interface Highlight {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function ProductTour({ steps, onComplete, onSkip, autoStart = true }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(autoStart);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const tourRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (!isVisible || !step) return;

    const updateHighlight = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlight({
          top: rect.top + window.scrollY - 10,
          left: rect.left + window.scrollX - 10,
          width: rect.width + 20,
          height: rect.height + 20,
        });
      }
    };

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight);

    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight);
    };
  }, [isVisible, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  if (!isVisible || !step) return null;

  const tooltipPosition = step.position || "bottom";
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
  };

  if (highlight) {
    switch (tooltipPosition) {
      case "top":
        tooltipStyle.top = highlight.top - 120;
        tooltipStyle.left = highlight.left + highlight.width / 2 - 150;
        break;
      case "bottom":
        tooltipStyle.top = highlight.top + highlight.height + 20;
        tooltipStyle.left = highlight.left + highlight.width / 2 - 150;
        break;
      case "left":
        tooltipStyle.top = highlight.top + highlight.height / 2 - 60;
        tooltipStyle.left = highlight.left - 320;
        break;
      case "right":
        tooltipStyle.top = highlight.top + highlight.height / 2 - 60;
        tooltipStyle.left = highlight.left + highlight.width + 20;
        break;
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleSkip}
        style={{ pointerEvents: "auto" }}
      />

      {/* Highlight Box */}
      {highlight && (
        <div
          className="fixed border-2 border-blue-400 bg-blue-500/5 rounded-lg pointer-events-none z-[9998]"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        className="fixed w-80 bg-white border-blue-400 shadow-2xl z-[9999]"
        style={tooltipStyle}
        ref={tourRef}
      >
        <CardContent className="p-6 space-y-4">
          {/* Step Counter */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Title and Description */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="border-gray-300"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="border-gray-300 text-gray-600"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Skip
              </Button>
            </div>

            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Restart Option */}
          {currentStep === steps.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="w-full text-blue-600 hover:bg-blue-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Tour
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
