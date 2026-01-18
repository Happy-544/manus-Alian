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

  // Handle swipe navigation
  const handleSwipeLeft = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    // Swipe left = next item (circular)
    const nextIndex = (currentIndex + 1) % navItems.length;
    navigate(navItems[nextIndex].path);
    triggerHapticFeedback();
    setTimeout(() => setIsNavigating(false), 300);
  };

  const handleSwipeRight = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    // Swipe right = previous item (circular)
    const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
    navigate(navItems[prevIndex].path);
    triggerHapticFeedback();
    setTimeout(() => setIsNavigating(false), 300);
  };

  // Trigger haptic feedback if available
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Use swipe gesture hook
  useSwipeGesture(navRef, {
    minDistance: 30,
    maxDuration: 500,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
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
