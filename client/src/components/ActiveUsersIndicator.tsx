import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export interface ActiveUser {
  id: number;
  name: string;
  avatar?: string;
  color: string;
  isTyping: boolean;
  cursorPosition: number;
  cursorLine: number;
}

interface ActiveUsersIndicatorProps {
  users: ActiveUser[];
  maxVisible?: number;
}

/**
 * Component to display active users currently editing a document
 */
export function ActiveUsersIndicator({
  users,
  maxVisible = 3,
}: ActiveUsersIndicatorProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);

  if (users.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground/70">
          Editing:
        </span>
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback
                      style={{
                        backgroundColor: user.color + "20",
                        color: user.color,
                      }}
                    >
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.isTyping && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: user.color }}
                      title="Typing..."
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">{user.name}</div>
                {user.isTyping && (
                  <div className="text-foreground/70">Typing...</div>
                )}
                <div className="text-foreground/70">
                  Line {user.cursorLine + 1}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background bg-muted hover:z-10 transition-transform hover:scale-110">
                  <AvatarFallback className="text-xs font-bold">
                    +{hiddenCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium">
                  {hiddenCount} more user{hiddenCount > 1 ? "s" : ""}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {users.some((u) => u.isTyping) && (
          <Badge variant="outline" className="text-xs animate-pulse">
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce animation-delay-100" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce animation-delay-200" />
            </div>
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Cursor indicator component for showing user cursors in editor
 */
export interface CursorIndicatorProps {
  user: ActiveUser;
  position: number;
  line: number;
  column: number;
}

export function CursorIndicator({
  user,
  position,
  line,
  column,
}: CursorIndicatorProps) {
  return (
    <div
      className="absolute w-0.5 h-5 animate-pulse"
      style={{
        backgroundColor: user.color,
        left: `${column * 8}px`,
        top: `${line * 20}px`,
      }}
      title={`${user.name}'s cursor`}
    >
      <div
        className="absolute top-0 left-0 px-1 py-0.5 text-xs font-bold text-white rounded whitespace-nowrap"
        style={{
          backgroundColor: user.color,
          transform: "translateY(-100%)",
          marginTop: "-4px",
        }}
      >
        {user.name}
      </div>
    </div>
  );
}
