import { eq, and, desc, sql, like, or, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  projects, InsertProject, Project,
  projectMembers, InsertProjectMember,
  tasks, InsertTask, Task,
  taskComments, InsertTaskComment,
  documents, InsertDocument,
  budgetCategories, InsertBudgetCategory,
  expenses, InsertExpense,
  milestones, InsertMilestone,
  notifications, InsertNotification,
  activityLogs, InsertActivityLog,
  aiChats, InsertAiChat
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "avatar", "phone", "jobTitle"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ============ PROJECT QUERIES ============
export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(project);
  return result[0].insertId;
}

export async function updateProject(id: number, project: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(project).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get projects where user is creator or member
  const memberProjectIds = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));
  
  const projectIds = memberProjectIds.map(m => m.projectId);
  
  if (projectIds.length === 0) {
    return db.select().from(projects).where(eq(projects.createdById, userId)).orderBy(desc(projects.updatedAt));
  }
  
  return db.select().from(projects)
    .where(or(eq(projects.createdById, userId), sql`${projects.id} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`))
    .orderBy(desc(projects.updatedAt));
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.updatedAt));
}

export async function getProjectStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, completed: 0, onHold: 0 };
  
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    active: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
    completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
    onHold: sql<number>`SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END)`,
  }).from(projects);
  
  return result[0] || { total: 0, active: 0, completed: 0, onHold: 0 };
}

// ============ PROJECT MEMBERS QUERIES ============
export async function addProjectMember(member: InsertProjectMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(projectMembers).values(member);
}

export async function removeProjectMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
}

export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const members = await db.select({
    id: projectMembers.id,
    projectId: projectMembers.projectId,
    userId: projectMembers.userId,
    role: projectMembers.role,
    joinedAt: projectMembers.joinedAt,
    userName: users.name,
    userEmail: users.email,
    userAvatar: users.avatar,
  })
  .from(projectMembers)
  .leftJoin(users, eq(projectMembers.userId, users.id))
  .where(eq(projectMembers.projectId, projectId));
  
  return members;
}

export async function isProjectMember(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  return result.length > 0;
}

// ============ TASK QUERIES ============
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function updateTask(id: number, task: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(task).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
}

export async function getTasksByAssignee(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.assigneeId, userId)).orderBy(desc(tasks.dueDate));
}

export async function getTaskStats(projectId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, todo: 0, inProgress: 0, completed: 0 };
  
  const whereClause = projectId ? eq(tasks.projectId, projectId) : sql`1=1`;
  
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    todo: sql<number>`SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END)`,
    inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
    completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
  }).from(tasks).where(whereClause);
  
  return result[0] || { total: 0, todo: 0, inProgress: 0, completed: 0 };
}

// ============ TASK COMMENTS QUERIES ============
export async function createTaskComment(comment: InsertTaskComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(taskComments).values(comment);
  return result[0].insertId;
}

export async function getTaskComments(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: taskComments.id,
    taskId: taskComments.taskId,
    userId: taskComments.userId,
    content: taskComments.content,
    createdAt: taskComments.createdAt,
    userName: users.name,
    userAvatar: users.avatar,
  })
  .from(taskComments)
  .leftJoin(users, eq(taskComments.userId, users.id))
  .where(eq(taskComments.taskId, taskId))
  .orderBy(desc(taskComments.createdAt));
}

// ============ DOCUMENT QUERIES ============
export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(doc);
  return result[0].insertId;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documents).where(eq(documents.id, id));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDocumentsByProject(projectId: number, category?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (category) {
    return db.select().from(documents)
      .where(and(eq(documents.projectId, projectId), eq(documents.category, category as any)))
      .orderBy(desc(documents.createdAt));
  }
  
  return db.select().from(documents).where(eq(documents.projectId, projectId)).orderBy(desc(documents.createdAt));
}

// ============ BUDGET CATEGORY QUERIES ============
export async function createBudgetCategory(category: InsertBudgetCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgetCategories).values(category);
  return result[0].insertId;
}

export async function updateBudgetCategory(id: number, category: Partial<InsertBudgetCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgetCategories).set(category).where(eq(budgetCategories.id, id));
}

export async function deleteBudgetCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(budgetCategories).where(eq(budgetCategories.id, id));
}

export async function getBudgetCategoriesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgetCategories).where(eq(budgetCategories.projectId, projectId));
}

// ============ EXPENSE QUERIES ============
export async function createExpense(expense: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(expenses).values(expense);
  return result[0].insertId;
}

export async function updateExpense(id: number, expense: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(expenses).set(expense).where(eq(expenses.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(expenses).where(eq(expenses.id, id));
}

export async function getExpensesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(expenses).where(eq(expenses.projectId, projectId)).orderBy(desc(expenses.expenseDate));
}

export async function getExpenseStats(projectId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0 };
  
  const result = await db.select({
    total: sql<number>`COALESCE(SUM(amount), 0)`,
    pending: sql<number>`COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)`,
    approved: sql<number>`COALESCE(SUM(CASE WHEN status = 'approved' OR status = 'paid' THEN amount ELSE 0 END), 0)`,
  }).from(expenses).where(eq(expenses.projectId, projectId));
  
  return result[0] || { total: 0, pending: 0, approved: 0 };
}

// ============ MILESTONE QUERIES ============
export async function createMilestone(milestone: InsertMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(milestones).values(milestone);
  return result[0].insertId;
}

export async function updateMilestone(id: number, milestone: Partial<InsertMilestone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(milestones).set(milestone).where(eq(milestones.id, id));
}

export async function deleteMilestone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(milestones).where(eq(milestones.id, id));
}

export async function getMilestonesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(milestones).where(eq(milestones.projectId, projectId)).orderBy(milestones.order);
}

// ============ NOTIFICATION QUERIES ============
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getNotificationsForUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count || 0;
}

// ============ ACTIVITY LOG QUERIES ============
export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(activityLogs).values(log);
}

export async function getActivityLogsByProject(projectId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: activityLogs.id,
    projectId: activityLogs.projectId,
    userId: activityLogs.userId,
    action: activityLogs.action,
    entityType: activityLogs.entityType,
    entityId: activityLogs.entityId,
    details: activityLogs.details,
    createdAt: activityLogs.createdAt,
    userName: users.name,
    userAvatar: users.avatar,
  })
  .from(activityLogs)
  .leftJoin(users, eq(activityLogs.userId, users.id))
  .where(eq(activityLogs.projectId, projectId))
  .orderBy(desc(activityLogs.createdAt))
  .limit(limit);
}

export async function getRecentActivities(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: activityLogs.id,
    projectId: activityLogs.projectId,
    userId: activityLogs.userId,
    action: activityLogs.action,
    entityType: activityLogs.entityType,
    entityId: activityLogs.entityId,
    details: activityLogs.details,
    createdAt: activityLogs.createdAt,
    userName: users.name,
    projectName: projects.name,
  })
  .from(activityLogs)
  .leftJoin(users, eq(activityLogs.userId, users.id))
  .leftJoin(projects, eq(activityLogs.projectId, projects.id))
  .orderBy(desc(activityLogs.createdAt))
  .limit(limit);
}

// ============ AI CHAT QUERIES ============
export async function createAiChat(chat: InsertAiChat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiChats).values(chat);
  return result[0].insertId;
}

export async function getAiChatHistory(userId: number, projectId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const whereClause = projectId 
    ? and(eq(aiChats.userId, userId), eq(aiChats.projectId, projectId))
    : eq(aiChats.userId, userId);
  
  return db.select().from(aiChats)
    .where(whereClause)
    .orderBy(aiChats.createdAt)
    .limit(limit);
}

export async function clearAiChatHistory(userId: number, projectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const whereClause = projectId 
    ? and(eq(aiChats.userId, userId), eq(aiChats.projectId, projectId))
    : eq(aiChats.userId, userId);
  
  await db.delete(aiChats).where(whereClause);
}
