import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Users, BarChart3, Zap, Settings } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut: string;
  onClick: () => void;
}

interface QuickActionsPanelProps {
  actions: QuickAction[];
}

export function QuickActionsPanel({ actions }: QuickActionsPanelProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Keyboard shortcuts for common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto flex flex-col items-start justify-start p-3 text-left"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-2 w-full mb-2">
                <div className="text-muted-foreground">{action.icon}</div>
                <span className="font-medium text-sm flex-1">{action.label}</span>
                <kbd className="text-xs bg-muted px-2 py-1 rounded border border-border font-mono">
                  {action.shortcut}
                </kbd>
              </div>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const DEFAULT_QUICK_ACTIONS: Omit<QuickAction, 'onClick'>[] = [
  {
    id: 'new-project',
    label: 'New Project',
    description: 'Create a new fit-out project',
    icon: <Plus className="w-4 h-4" />,
    shortcut: 'Ctrl+N',
  },
  {
    id: 'new-task',
    label: 'New Task',
    description: 'Add a task to current project',
    icon: <Plus className="w-4 h-4" />,
    shortcut: 'Ctrl+Shift+N',
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Search projects and tasks',
    icon: <Search className="w-4 h-4" />,
    shortcut: 'Ctrl+K',
  },
  {
    id: 'new-sprint',
    label: 'New Sprint',
    description: 'Create a new sprint',
    icon: <Zap className="w-4 h-4" />,
    shortcut: 'Ctrl+S',
  },
  {
    id: 'invite-team',
    label: 'Invite Team',
    description: 'Add team members',
    icon: <Users className="w-4 h-4" />,
    shortcut: 'Ctrl+I',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'View project analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    shortcut: 'Ctrl+A',
  },
];
