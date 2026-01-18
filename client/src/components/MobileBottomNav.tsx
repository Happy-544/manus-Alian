import { useLocation } from "wouter";
import { useRef, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={24} />,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: <FolderKanban size={24} />,
    label: "Projects",
    path: "/projects",
  },
  {
    icon: <FileText size={24} />,
    label: "Documents",
    path: "/documents/library",
  },
  {
    icon: <Settings size={24} />,
    label: "Settings",
    path: "/settings/account",
  },
];

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const isActive = (path: string): boolean => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Find current nav item index
  const currentIndex = navItems.findIndex((item) => isActive(item.path));

  // Calculate navigation steps based on velocity
  const getNavigationSteps = (velocity?: number): number => {
    if (!velocity) return 1;
    // Velocity is in px/ms
    // 0.5-1.0 px/ms = 1 step, 1.0-1.5 = 2 steps, 1.5+ = 3 steps
    if (velocity >= 1.5) return 3;
    if (velocity >= 1.0) return 2;
    return 1;
  };

  // Handle swipe navigation
  const handleSwipeLeft = (velocity?: number) => {
    if (isNavigating) return;
    setIsNavigating(true);
    const steps = getNavigationSteps(velocity);
    const nextIndex = (currentIndex + steps) % navItems.length;
    navigate(navItems[nextIndex].path);
    triggerHapticFeedback(velocity);
    setTimeout(() => setIsNavigating(false), 300);
  };

  const handleSwipeRight = (velocity?: number) => {
    if (isNavigating) return;
    setIsNavigating(true);
    const steps = getNavigationSteps(velocity);
    const prevIndex = (currentIndex - steps + navItems.length * 3) % navItems.length;
    navigate(navItems[prevIndex].path);
    triggerHapticFeedback(velocity);
    setTimeout(() => setIsNavigating(false), 300);
  };

  // Handle fast swipes (skip to next/previous)
  const handleFastSwipeLeft = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    const nextIndex = (currentIndex + 1) % navItems.length;
    navigate(navItems[nextIndex].path);
    triggerHapticFeedback(1.0, true);
    setTimeout(() => setIsNavigating(false), 200);
  };

  const handleFastSwipeRight = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
    navigate(navItems[prevIndex].path);
    triggerHapticFeedback(1.0, true);
    setTimeout(() => setIsNavigating(false), 200);
  };

  // Trigger haptic feedback if available
  const triggerHapticFeedback = (velocity?: number, isFast?: boolean) => {
    if (!navigator.vibrate) return;
    
    if (isFast) {
      // Double tap for fast swipe
      navigator.vibrate([10, 50, 10]);
    } else if (velocity && velocity > 1.0) {
      // Stronger feedback for high velocity
      navigator.vibrate(15);
    } else {
      // Normal feedback
      navigator.vibrate(10);
    }
  };

  // Use swipe gesture hook with velocity detection
  useSwipeGesture(navRef, {
    minDistance: 30,
    maxDuration: 500,
    velocityThreshold: 1.0,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onFastSwipeLeft: handleFastSwipeLeft,
    onFastSwipeRight: handleFastSwipeRight,
  });

  return (
    <div
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 h-20 bg-primary border-t border-gold/20 flex items-center justify-around px-2 md:hidden z-40 shadow-lg touch-none select-none"
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          disabled={isNavigating}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 ${
            isActive(item.path)
              ? "bg-gold/20 text-gold shadow-md ring-2 ring-gold/40"
              : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary/80"
          }`}
          title={item.label}
          aria-label={item.label}
          aria-current={isActive(item.path) ? "page" : undefined}
        >
          <div className={`flex items-center justify-center transition-all duration-300 ${
            isActive(item.path) ? "scale-110" : "scale-100"
          }`}>
            {item.icon}
          </div>
          <span className="text-xs mt-1 font-medium text-center leading-none">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
