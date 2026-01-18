import { useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";

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

  const isActive = (path: string): boolean => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-primary border-t border-gold/20 flex items-center justify-around px-2 md:hidden z-40 shadow-lg">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-300 ease-out active:scale-95 ${
            isActive(item.path)
              ? "bg-gold/20 text-gold shadow-md"
              : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary/80"
          }`}
          title={item.label}
          aria-label={item.label}
          aria-current={isActive(item.path) ? "page" : undefined}
        >
          <div className="flex items-center justify-center transition-transform duration-300">
            {item.icon}
          </div>
          <span className="text-xs mt-1 font-medium text-center leading-none">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
