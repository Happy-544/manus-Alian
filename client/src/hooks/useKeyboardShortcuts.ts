import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatches = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.handler();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const COMMON_SHORTCUTS: Record<string, Omit<KeyboardShortcut, 'handler'>> = {
  SEARCH: {
    key: 'k',
    ctrl: true,
    description: 'Search projects and tasks',
  },
  NEW_PROJECT: {
    key: 'n',
    ctrl: true,
    description: 'Create new project',
  },
  NEW_TASK: {
    key: 'n',
    ctrl: true,
    shift: true,
    description: 'Create new task',
  },
  NEW_SPRINT: {
    key: 's',
    ctrl: true,
    description: 'Create new sprint',
  },
  INVITE_TEAM: {
    key: 'i',
    ctrl: true,
    description: 'Invite team member',
  },
  VIEW_ANALYTICS: {
    key: 'a',
    ctrl: true,
    description: 'View analytics',
  },
  TOGGLE_SIDEBAR: {
    key: 'b',
    ctrl: true,
    description: 'Toggle sidebar',
  },
};
