import { eq, and, desc, asc } from "drizzle-orm";
import {
  sprints, InsertSprint, Sprint,
  sprintTasks, InsertSprintTask, SprintTask,
  teamVelocity, InsertTeamVelocity, TeamVelocity,
  burndownData, InsertBurndownData, BurndownData,
  workspaceStorage, InsertWorkspaceStorage, WorkspaceStorage,
  tasks, Task
} from "../drizzle/schema";
import { getDb } from "./db";

// ============ SPRINT QUERIES ============

export async function createSprint(sprint: InsertSprint): Promise<Sprint | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(sprints).values(sprint);
    const sprintId = result[0].insertId;
    return getSprint(sprintId as number);
  } catch (error) {
    console.error("[Sprint] Failed to create sprint:", error);
    return null;
  }
}

export async function getSprint(id: number): Promise<Sprint | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(sprints).where(eq(sprints.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("[Sprint] Failed to get sprint:", error);
    return null;
  }
}

export async function getProjectSprints(projectId: number): Promise<Sprint[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(sprints).where(eq(sprints.projectId, projectId)).orderBy(desc(sprints.createdAt));
  } catch (error) {
    console.error("[Sprint] Failed to get project sprints:", error);
    return [];
  }
}

export async function getActiveSprints(projectId: number): Promise<Sprint[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(sprints)
      .where(and(eq(sprints.projectId, projectId), eq(sprints.status, "active")))
      .orderBy(desc(sprints.startDate));
  } catch (error) {
    console.error("[Sprint] Failed to get active sprints:", error);
    return [];
  }
}

export async function updateSprint(id: number, updates: Partial<InsertSprint>): Promise<Sprint | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(sprints).set(updates).where(eq(sprints.id, id));
    return getSprint(id);
  } catch (error) {
    console.error("[Sprint] Failed to update sprint:", error);
    return null;
  }
}

// ============ SPRINT TASK QUERIES ============

export async function addTaskToSprint(sprintTask: InsertSprintTask): Promise<SprintTask | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(sprintTasks).values(sprintTask);
    const id = result[0].insertId as number;
    const data = await db.select().from(sprintTasks).where(eq(sprintTasks.id, id));
    return data[0] || null;
  } catch (error) {
    console.error("[SprintTask] Failed to add task to sprint:", error);
    return null;
  }
}

export async function getSprintTasks(sprintId: number): Promise<SprintTask[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(sprintTasks).where(eq(sprintTasks.sprintId, sprintId));
  } catch (error) {
    console.error("[SprintTask] Failed to get sprint tasks:", error);
    return [];
  }
}

export async function removeTaskFromSprint(sprintTaskId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(sprintTasks).where(eq(sprintTasks.id, sprintTaskId));
    return true;
  } catch (error) {
    console.error("[SprintTask] Failed to remove task from sprint:", error);
    return false;
  }
}

// ============ TEAM VELOCITY QUERIES ============

export async function recordTeamVelocity(velocity: InsertTeamVelocity): Promise<TeamVelocity | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(teamVelocity).values(velocity);
    const id = result[0].insertId as number;
    const data = await db.select().from(teamVelocity).where(eq(teamVelocity.id, id));
    return data[0] || null;
  } catch (error) {
    console.error("[TeamVelocity] Failed to record velocity:", error);
    return null;
  }
}

export async function getProjectVelocityHistory(projectId: number, limit: number = 10): Promise<TeamVelocity[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(teamVelocity)
      .where(eq(teamVelocity.projectId, projectId))
      .orderBy(desc(teamVelocity.recordedAt))
      .limit(limit);
  } catch (error) {
    console.error("[TeamVelocity] Failed to get velocity history:", error);
    return [];
  }
}

export async function getSprintVelocity(sprintId: number): Promise<TeamVelocity | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(teamVelocity).where(eq(teamVelocity.sprintId, sprintId));
    return result[0] || null;
  } catch (error) {
    console.error("[TeamVelocity] Failed to get sprint velocity:", error);
    return null;
  }
}

// ============ BURNDOWN DATA QUERIES ============

export async function recordBurndownData(data: InsertBurndownData): Promise<BurndownData | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(burndownData).values(data);
    const id = result[0].insertId as number;
    const burnData = await db.select().from(burndownData).where(eq(burndownData.id, id));
    return burnData[0] || null;
  } catch (error) {
    console.error("[Burndown] Failed to record burndown data:", error);
    return null;
  }
}

export async function getSprintBurndown(sprintId: number): Promise<BurndownData[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(burndownData)
      .where(eq(burndownData.sprintId, sprintId))
      .orderBy(asc(burndownData.day));
  } catch (error) {
    console.error("[Burndown] Failed to get sprint burndown:", error);
    return [];
  }
}

// ============ WORKSPACE STORAGE QUERIES ============

export async function recordWorkspaceStorage(storage: InsertWorkspaceStorage): Promise<WorkspaceStorage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(workspaceStorage).values(storage);
    const id = result[0].insertId as number;
    const data = await db.select().from(workspaceStorage).where(eq(workspaceStorage.id, id));
    return data[0] || null;
  } catch (error) {
    console.error("[WorkspaceStorage] Failed to record storage:", error);
    return null;
  }
}

export async function getProjectStorage(projectId: number): Promise<WorkspaceStorage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(workspaceStorage)
      .where(eq(workspaceStorage.projectId, projectId))
      .orderBy(desc(workspaceStorage.lastCalculatedAt))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[WorkspaceStorage] Failed to get project storage:", error);
    return null;
  }
}

export async function updateWorkspaceStorage(projectId: number, updates: Partial<InsertWorkspaceStorage>): Promise<WorkspaceStorage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(workspaceStorage).set(updates).where(eq(workspaceStorage.projectId, projectId));
    return getProjectStorage(projectId);
  } catch (error) {
    console.error("[WorkspaceStorage] Failed to update storage:", error);
    return null;
  }
}

// ============ HELPER FUNCTIONS ============

export async function calculateSprintMetrics(sprintId: number): Promise<{
  totalPoints: number;
  completedPoints: number;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const sprintTasksList = await getSprintTasks(sprintId);
    let totalPoints = 0;
    let completedPoints = 0;
    let completedTasks = 0;
    let totalTasks = sprintTasksList.length;

    for (const st of sprintTasksList) {
      const task = await db.select().from(tasks).where(eq(tasks.id, st.taskId));
      if (task[0]) {
        totalPoints += st.storyPoints || 0;
        if (task[0].status === "completed") {
          completedPoints += st.storyPoints || 0;
          completedTasks++;
        }
      }
    }

    const progressPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return {
      totalPoints,
      completedPoints,
      completedTasks,
      totalTasks,
      progressPercentage
    };
  } catch (error) {
    console.error("[Sprint] Failed to calculate metrics:", error);
    return null;
  }
}
