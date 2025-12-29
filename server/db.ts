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
  aiChats, InsertAiChat,
  vendors, InsertVendor,
  procurementItems, InsertProcurementItem,
  purchaseOrders, InsertPurchaseOrder,
  purchaseOrderItems, InsertPurchaseOrderItem,
  deliveries, InsertDelivery,
  projectBaselines, InsertProjectBaseline,
  baselineTasks, InsertBaselineTask,
  scheduleVariances, InsertScheduleVariance,
  progressSnapshots, InsertProgressSnapshot,
  materialList, InsertMaterialListItem, MaterialListItem,
  ffeList, InsertFFEListItem, FFEListItem,
  documentGenerations, InsertDocumentGeneration, DocumentGeneration,
  dubaiMarketData, InsertDubaiMarketData, DubaiMarketData,
  generatedArtifacts, InsertGeneratedArtifact, GeneratedArtifact,
  documentExports, InsertDocumentExport,
  emailSchedules, InsertEmailSchedule,
  documentComments, InsertDocumentComment,
  documentVersions, InsertDocumentVersion
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


// ============ VENDOR QUERIES ============
export async function createVendor(vendor: InsertVendor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vendors).values(vendor);
  return result[0].insertId;
}

export async function updateVendor(id: number, vendor: Partial<InsertVendor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vendors).set(vendor).where(eq(vendors.id, id));
}

export async function deleteVendor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vendors).where(eq(vendors.id, id));
}

export async function getVendors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendors).where(eq(vendors.isActive, true)).orderBy(vendors.name);
}

export async function getVendorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  return result[0];
}

export async function getVendorsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendors).where(and(eq(vendors.category, category as any), eq(vendors.isActive, true)));
}

// ============ PROCUREMENT ITEM QUERIES ============
export async function createProcurementItem(item: InsertProcurementItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(procurementItems).values(item);
  return result[0].insertId;
}

export async function updateProcurementItem(id: number, item: Partial<InsertProcurementItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(procurementItems).set(item).where(eq(procurementItems.id, id));
}

export async function deleteProcurementItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(procurementItems).where(eq(procurementItems.id, id));
}

export async function getProcurementItemsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: procurementItems.id,
    projectId: procurementItems.projectId,
    name: procurementItems.name,
    description: procurementItems.description,
    category: procurementItems.category,
    quantity: procurementItems.quantity,
    unit: procurementItems.unit,
    estimatedUnitCost: procurementItems.estimatedUnitCost,
    actualUnitCost: procurementItems.actualUnitCost,
    totalCost: procurementItems.totalCost,
    status: procurementItems.status,
    priority: procurementItems.priority,
    requiredDate: procurementItems.requiredDate,
    vendorId: procurementItems.vendorId,
    specifications: procurementItems.specifications,
    notes: procurementItems.notes,
    createdById: procurementItems.createdById,
    createdAt: procurementItems.createdAt,
    updatedAt: procurementItems.updatedAt,
    vendorName: vendors.name,
  })
  .from(procurementItems)
  .leftJoin(vendors, eq(procurementItems.vendorId, vendors.id))
  .where(eq(procurementItems.projectId, projectId))
  .orderBy(desc(procurementItems.createdAt));
}

export async function getProcurementItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(procurementItems).where(eq(procurementItems.id, id)).limit(1);
  return result[0];
}

export async function getProcurementStats(projectId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, ordered: 0, delivered: 0, totalCost: 0 };
  
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    pending: sql<number>`SUM(CASE WHEN status IN ('pending', 'quoted', 'approved') THEN 1 ELSE 0 END)`,
    ordered: sql<number>`SUM(CASE WHEN status IN ('ordered', 'shipped') THEN 1 ELSE 0 END)`,
    delivered: sql<number>`SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)`,
    totalCost: sql<number>`COALESCE(SUM(totalCost), 0)`,
  }).from(procurementItems).where(eq(procurementItems.projectId, projectId));
  
  return result[0] || { total: 0, pending: 0, ordered: 0, delivered: 0, totalCost: 0 };
}

// ============ PURCHASE ORDER QUERIES ============
export async function createPurchaseOrder(order: InsertPurchaseOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseOrders).values(order);
  return result[0].insertId;
}

export async function updatePurchaseOrder(id: number, order: Partial<InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseOrders).set(order).where(eq(purchaseOrders.id, id));
}

export async function deletePurchaseOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
}

export async function getPurchaseOrdersByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: purchaseOrders.id,
    projectId: purchaseOrders.projectId,
    vendorId: purchaseOrders.vendorId,
    orderNumber: purchaseOrders.orderNumber,
    status: purchaseOrders.status,
    totalAmount: purchaseOrders.totalAmount,
    currency: purchaseOrders.currency,
    orderDate: purchaseOrders.orderDate,
    expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
    actualDeliveryDate: purchaseOrders.actualDeliveryDate,
    notes: purchaseOrders.notes,
    createdAt: purchaseOrders.createdAt,
    vendorName: vendors.name,
  })
  .from(purchaseOrders)
  .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
  .where(eq(purchaseOrders.projectId, projectId))
  .orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result[0];
}

// ============ PURCHASE ORDER ITEM QUERIES ============
export async function createPurchaseOrderItem(item: InsertPurchaseOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseOrderItems).values(item);
  return result[0].insertId;
}

export async function getPurchaseOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

// ============ DELIVERY QUERIES ============
export async function createDelivery(delivery: InsertDelivery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliveries).values(delivery);
  return result[0].insertId;
}

export async function updateDelivery(id: number, delivery: Partial<InsertDelivery>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliveries).set(delivery).where(eq(deliveries.id, id));
}

export async function getDeliveriesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: deliveries.id,
    purchaseOrderId: deliveries.purchaseOrderId,
    projectId: deliveries.projectId,
    deliveryNumber: deliveries.deliveryNumber,
    status: deliveries.status,
    scheduledDate: deliveries.scheduledDate,
    actualDate: deliveries.actualDate,
    notes: deliveries.notes,
    createdAt: deliveries.createdAt,
    orderNumber: purchaseOrders.orderNumber,
    vendorName: vendors.name,
  })
  .from(deliveries)
  .leftJoin(purchaseOrders, eq(deliveries.purchaseOrderId, purchaseOrders.id))
  .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
  .where(eq(deliveries.projectId, projectId))
  .orderBy(desc(deliveries.scheduledDate));
}

// ============ BASELINE QUERIES ============
export async function createBaseline(baseline: InsertProjectBaseline) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectBaselines).values(baseline);
  return result[0].insertId;
}

export async function updateBaseline(id: number, baseline: Partial<InsertProjectBaseline>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectBaselines).set(baseline).where(eq(projectBaselines.id, id));
}

export async function deleteBaseline(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectBaselines).where(eq(projectBaselines.id, id));
}

export async function getBaselinesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectBaselines).where(eq(projectBaselines.projectId, projectId)).orderBy(desc(projectBaselines.createdAt));
}

export async function getActiveBaseline(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projectBaselines)
    .where(and(eq(projectBaselines.projectId, projectId), eq(projectBaselines.isActive, true)))
    .limit(1);
  return result[0];
}

export async function getBaselineById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projectBaselines).where(eq(projectBaselines.id, id)).limit(1);
  return result[0];
}

// ============ BASELINE TASK QUERIES ============
export async function createBaselineTask(task: InsertBaselineTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(baselineTasks).values(task);
  return result[0].insertId;
}

export async function createBaselineTasks(tasksList: InsertBaselineTask[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (tasksList.length === 0) return;
  await db.insert(baselineTasks).values(tasksList);
}

export async function getBaselineTasks(baselineId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(baselineTasks).where(eq(baselineTasks.baselineId, baselineId)).orderBy(baselineTasks.order);
}

export async function deleteBaselineTasks(baselineId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(baselineTasks).where(eq(baselineTasks.baselineId, baselineId));
}

// ============ SCHEDULE VARIANCE QUERIES ============
export async function createScheduleVariance(variance: InsertScheduleVariance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scheduleVariances).values(variance);
  return result[0].insertId;
}

export async function getScheduleVariances(projectId: number, baselineId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(scheduleVariances.projectId, projectId)];
  if (baselineId) {
    conditions.push(eq(scheduleVariances.baselineId, baselineId));
  }
  
  return db.select().from(scheduleVariances).where(and(...conditions)).orderBy(desc(scheduleVariances.recordedAt));
}

// ============ PROGRESS SNAPSHOT QUERIES ============
export async function createProgressSnapshot(snapshot: InsertProgressSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(progressSnapshots).values(snapshot);
  return result[0].insertId;
}

export async function getProgressSnapshots(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(progressSnapshots).where(eq(progressSnapshots.projectId, projectId)).orderBy(progressSnapshots.snapshotDate);
}

export async function getLatestProgressSnapshot(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(progressSnapshots)
    .where(eq(progressSnapshots.projectId, projectId))
    .orderBy(desc(progressSnapshots.snapshotDate))
    .limit(1);
  return result[0];
}


// ============ MATERIAL LIST QUERIES ============
export async function createMaterialItem(item: InsertMaterialListItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(materialList).values(item);
  return result[0].insertId;
}

export async function getMaterialItems(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materialList).where(eq(materialList.projectId, projectId)).orderBy(materialList.createdAt);
}

export async function getMaterialItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(materialList).where(eq(materialList.id, id)).limit(1);
  return result[0] || null;
}

export async function updateMaterialItem(id: number, updates: Partial<InsertMaterialListItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(materialList).set(updates).where(eq(materialList.id, id));
}

export async function deleteMaterialItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(materialList).where(eq(materialList.id, id));
}

// ============ FF&E LIST QUERIES ============
export async function createFFEItem(item: InsertFFEListItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ffeList).values(item);
  return result[0].insertId;
}

export async function getFFEItems(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ffeList).where(eq(ffeList.projectId, projectId)).orderBy(ffeList.createdAt);
}

export async function getFFEItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ffeList).where(eq(ffeList.id, id)).limit(1);
  return result[0] || null;
}

export async function updateFFEItem(id: number, updates: Partial<InsertFFEListItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ffeList).set(updates).where(eq(ffeList.id, id));
}

export async function deleteFFEItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ffeList).where(eq(ffeList.id, id));
}


// ============ DOCUMENT GENERATION QUERIES ============
export async function createDocumentGeneration(doc: InsertDocumentGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentGenerations).values(doc);
  return result[0].insertId;
}

export async function updateDocumentGeneration(id: number, doc: Partial<InsertDocumentGeneration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documentGenerations).set(doc).where(eq(documentGenerations.id, id));
}

export async function getDocumentGenerationsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentGenerations)
    .where(eq(documentGenerations.projectId, projectId))
    .orderBy(desc(documentGenerations.createdAt));
}

export async function getDocumentGenerationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documentGenerations)
    .where(eq(documentGenerations.id, id))
    .limit(1);
  return result[0];
}

export async function deleteDocumentGeneration(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentGenerations).where(eq(documentGenerations.id, id));
}

// ============ DUBAI MARKET DATA QUERIES ============
export async function createMarketData(data: InsertDubaiMarketData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dubaiMarketData).values(data);
  return result[0].insertId;
}

export async function getMarketDataByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dubaiMarketData)
    .where(eq(dubaiMarketData.category, category))
    .orderBy(desc(dubaiMarketData.lastUpdated));
}

export async function getMarketDataByItem(itemName: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dubaiMarketData)
    .where(like(dubaiMarketData.itemName, `%${itemName}%`))
    .orderBy(desc(dubaiMarketData.lastUpdated));
}

export async function getAllMarketData() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dubaiMarketData)
    .orderBy(dubaiMarketData.category, dubaiMarketData.itemName);
}

// ============ GENERATED ARTIFACTS QUERIES ============
export async function createGeneratedArtifact(artifact: InsertGeneratedArtifact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(generatedArtifacts).values(artifact);
  return result[0].insertId;
}

export async function getGeneratedArtifactsByGeneration(generationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedArtifacts)
    .where(eq(generatedArtifacts.generationId, generationId))
    .orderBy(generatedArtifacts.artifactType);
}

export async function updateGeneratedArtifact(id: number, artifact: Partial<InsertGeneratedArtifact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(generatedArtifacts).set(artifact).where(eq(generatedArtifacts.id, id));
}

export async function deleteGeneratedArtifact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(generatedArtifacts).where(eq(generatedArtifacts.id, id));
}


// Document Export functions
export async function createDocumentExport(exportData: InsertDocumentExport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentExports).values(exportData);
  return result;
}

export async function getDocumentExportsByGeneration(generationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentExports)
    .where(eq(documentExports.generationId, generationId))
    .orderBy(documentExports.createdAt);
}

export async function deleteDocumentExport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentExports).where(eq(documentExports.id, id));
}

// Email Schedule functions
export async function createEmailSchedule(scheduleData: InsertEmailSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailSchedules).values(scheduleData);
  return result;
}

export async function getEmailSchedulesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSchedules)
    .where(eq(emailSchedules.projectId, projectId))
    .orderBy(emailSchedules.createdAt);
}

export async function updateEmailSchedule(id: number, scheduleData: Partial<InsertEmailSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailSchedules).set(scheduleData).where(eq(emailSchedules.id, id));
}

export async function deleteEmailSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailSchedules).where(eq(emailSchedules.id, id));
}

export async function getActiveEmailSchedules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSchedules)
    .where(eq(emailSchedules.isActive, true));
}

// Document Comment functions
export async function createDocumentComment(commentData: InsertDocumentComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentComments).values(commentData);
  return result;
}

export async function getDocumentCommentsByGeneration(generationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentComments)
    .where(eq(documentComments.generationId, generationId))
    .orderBy(documentComments.createdAt);
}

export async function updateDocumentComment(id: number, commentData: Partial<InsertDocumentComment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documentComments).set(commentData).where(eq(documentComments.id, id));
}

export async function deleteDocumentComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentComments).where(eq(documentComments.id, id));
}

// Document Version functions
export async function createDocumentVersion(versionData: InsertDocumentVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentVersions).values(versionData);
  return result;
}

export async function getDocumentVersionsByGeneration(generationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentVersions)
    .where(eq(documentVersions.generationId, generationId))
    .orderBy(desc(documentVersions.versionNumber));
}

export async function getLatestDocumentVersion(generationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(documentVersions)
    .where(eq(documentVersions.generationId, generationId))
    .orderBy(desc(documentVersions.versionNumber))
    .limit(1);
  return result[0] || null;
}
