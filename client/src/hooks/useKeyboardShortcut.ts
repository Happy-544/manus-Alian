import { useEffect } from "react";

export interface KeyboardShortcutConfig {
  key: string; // Key to listen for (e.g., "?", "Enter", "Escape")
  ctrlKey?: boolean; // Require Ctrl/Cmd key
  shiftKey?: boolean; // Require Shift key
  altKey?: boolean; // Require Alt key
  callback: () => void; // Callback when shortcut is triggered
  enabled?: boolean; // Enable/disable shortcut (default: true)
  preventDefault?: boolean; // Prevent default action (default: true)
}

/**
 * Custom hook for handling global keyboard shortcuts
 * @param config - Keyboard shortcut configuration
 */
export function useKeyboardShortcut(config: KeyboardShortcutConfig) {
  const {
    key,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    callback,
    enabled = true,
    preventDefault = true,
  } = config;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key matches
      const keyMatches =
        event.key === key ||
        event.key.toLowerCase() === key.toLowerCase() ||
        event.code === key;

      // Check modifier keys
      const ctrlMatches = ctrlKey ? event.ctrlKey || event.metaKey : true;
      const shiftMatches = shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatches = altKey ? event.altKey : !event.altKey;

      // Check if input is focused (to avoid triggering shortcuts in text fields)
      const isInputFocused =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;

      if (
        keyMatches &&
        ctrlMatches &&
        shiftMatches &&
        altMatches &&
        !isInputFocused
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, ctrlKey, shiftKey, altKey, callback, enabled, preventDefault]);
}

/**
 * Hook for handling multiple keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcut configurations
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcutConfig[]) {
  shortcuts.forEach((shortcut) => {
    useKeyboardShortcut(shortcut);
  });
}
