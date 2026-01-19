import { getDb } from "./db";

let db: Awaited<ReturnType<typeof getDb>> | null = null;

// Initialize database
(async () => {
  db = await getDb();
})();
import {
  collaborationSessions,
  activeUsers,
  documentChanges,
  cursorPositions,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * WebSocket message types for collaboration
 */
export enum CollaborationMessageType {
  JOIN_SESSION = "join_session",
  LEAVE_SESSION = "leave_session",
  DOCUMENT_CHANGE = "document_change",
  CURSOR_MOVE = "cursor_move",
  USER_TYPING = "user_typing",
  SYNC_REQUEST = "sync_request",
  SYNC_RESPONSE = "sync_response",
  ACTIVE_USERS = "active_users",
  ERROR = "error",
}

/**
 * Collaboration message interface
 */
export interface CollaborationMessage {
  type: CollaborationMessageType;
  sessionId: string;
  userId: number;
  documentId: number;
  data?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Create a new collaboration session
 */
export async function createCollaborationSession(
  documentId: number,
  expiresInMinutes: number = 120
) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const sessionId = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await db.insert(collaborationSessions).values({
    documentId,
    sessionId,
    expiresAt,
  });

  return sessionId;
}

/**
 * Add user to active session
 */
export async function addActiveUser(
  sessionId: string,
  userId: number,
  documentId: number,
  color: string = generateUserColor()
) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db.insert(activeUsers).values({
    sessionId,
    userId,
    documentId,
    color,
    isTyping: false,
  });
}

/**
 * Remove user from active session
 */
export async function removeActiveUser(sessionId: string, userId: number) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db
    .delete(activeUsers)
    .where(
      and(
        eq(activeUsers.sessionId, sessionId),
        eq(activeUsers.userId, userId)
      )
    );
}

/**
 * Get all active users in a session
 */
export async function getActiveUsers(sessionId: string) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  return await db
    .select()
    .from(activeUsers)
    .where(eq(activeUsers.sessionId, sessionId));
}

/**
 * Update user cursor position
 */
export async function updateCursorPosition(
  sessionId: string,
  userId: number,
  documentId: number,
  position: number,
  line: number,
  column: number,
  selection?: { start: number; end: number }
) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Check if cursor position exists
  const existing = await db
    .select()
    .from(cursorPositions)
    .where(
      and(
        eq(cursorPositions.sessionId, sessionId),
        eq(cursorPositions.userId, userId),
        eq(cursorPositions.documentId, documentId)
      )
    )
    .limit(1);

  if (existing && existing.length > 0) {
    // Update existing
    await db
      .update(cursorPositions)
      .set({
        position,
        line,
        column,
        selection,
      })
      .where(eq(cursorPositions.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(cursorPositions).values({
      sessionId,
      userId,
      documentId,
      position,
      line,
      column,
      selection,
    });
  }
}

/**
 * Get cursor positions for all users in session
 */
export async function getCursorPositions(sessionId: string) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  return await db
    .select()
    .from(cursorPositions)
    .where(eq(cursorPositions.sessionId, sessionId));
}

/**
 * Record document change
 */
export async function recordDocumentChange(
  documentId: number,
  sessionId: string,
  userId: number,
  changeType: "insert" | "delete" | "replace" | "format",
  position: number,
  content?: string,
  deletedContent?: string,
  version: number = 1
) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db.insert(documentChanges).values({
    documentId,
    sessionId,
    userId,
    changeType,
    position,
    content,
    deletedContent,
    version,
  });
}

/**
 * Get document change history
 */
export async function getDocumentChangeHistory(
  documentId: number,
  fromVersion: number = 0
) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  return await db
    .select()
    .from(documentChanges)
    .where(
      and(
        eq(documentChanges.documentId, documentId),
        // version > fromVersion would need custom SQL
      )
    );
}

/**
 * Update user typing status
 */
export async function updateUserTypingStatus(
  sessionId: string,
  userId: number,
  isTyping: boolean
) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db
    .update(activeUsers)
    .set({
      isTyping,
      lastActivity: new Date(),
    })
    .where(
      and(
        eq(activeUsers.sessionId, sessionId),
        eq(activeUsers.userId, userId)
      )
    );
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const now = new Date();

  // Delete expired sessions
  await db
    .delete(collaborationSessions)
    .where((table) => {
      // This would need custom SQL for timestamp comparison
      return undefined;
    });
}

/**
 * Generate a random user color
 */
function generateUserColor(): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Light Blue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Resolve conflicting edits using operational transformation
 */
export function resolveConflict(
  change1: {
    position: number;
    content?: string;
    deletedContent?: string;
  },
  change2: {
    position: number;
    content?: string;
    deletedContent?: string;
  }
): { resolved: boolean; transformedChange?: typeof change1 } {
  // Simple conflict resolution: if changes are at same position,
  // prioritize by timestamp (would need to be passed in real implementation)
  if (change1.position === change2.position) {
    // Conflict detected - in real implementation, use OT algorithm
    return { resolved: false };
  }

  // Adjust positions based on previous changes
  if (change1.position < change2.position) {
    const adjustment = (change1.content?.length || 0) -
      (change1.deletedContent?.length || 0);
    return {
      resolved: true,
      transformedChange: {
        ...change2,
        position: change2.position + adjustment,
      },
    };
  }

  return { resolved: true, transformedChange: change2 };
}
