import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 20 }),
  jobTitle: varchar("jobTitle", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - core entity for construction projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 20 }),
  location: text("location"),
  address: text("address"),
  status: mysqlEnum("status", ["planning", "in_progress", "on_hold", "completed", "cancelled"]).default("planning").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  spentAmount: decimal("spentAmount", { precision: 15, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  actualEndDate: timestamp("actualEndDate"),
  progress: int("progress").default(0),
  coverImage: text("coverImage"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project team members - links users to projects with roles
 */
export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["project_manager", "site_engineer", "architect", "contractor", "consultant", "viewer"]).default("viewer").notNull(),
  permissions: json("permissions").$type<string[]>(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * Tasks table - task management within projects
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  parentTaskId: int("parentTaskId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "in_review", "completed", "cancelled"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  assigneeId: int("assigneeId"),
  createdById: int("createdById").notNull(),
  startDate: timestamp("startDate"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  estimatedHours: decimal("estimatedHours", { precision: 8, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 8, scale: 2 }),
  progress: int("progress").default(0),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Task comments - discussion on tasks
 */
export const taskComments = mysqlTable("task_comments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

/**
 * Documents table - file storage for projects
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["drawing", "contract", "invoice", "report", "permit", "photo", "specification", "other"]).default("other").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  version: int("version").default(1),
  uploadedById: int("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Budget categories - cost breakdown structure
 */
export const budgetCategories = mysqlTable("budget_categories", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  allocatedAmount: decimal("allocatedAmount", { precision: 15, scale: 2 }).default("0"),
  spentAmount: decimal("spentAmount", { precision: 15, scale: 2 }).default("0"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = typeof budgetCategories.$inferInsert;

/**
 * Expenses - individual expense entries
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  categoryId: int("categoryId"),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  vendor: varchar("vendor", { length: 255 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  expenseDate: timestamp("expenseDate").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "paid"]).default("pending").notNull(),
  receiptUrl: text("receiptUrl"),
  notes: text("notes"),
  createdById: int("createdById").notNull(),
  approvedById: int("approvedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Project milestones - key dates and phases
 */
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  completedDate: timestamp("completedDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "delayed"]).default("pending").notNull(),
  color: varchar("color", { length: 7 }),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

/**
 * Notifications - user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  type: mysqlEnum("type", ["task_assigned", "task_updated", "project_updated", "comment_added", "deadline_reminder", "budget_alert", "milestone_reached", "general"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Activity log - audit trail for projects
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  details: json("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * AI Chat history - stores AI assistant conversations
 */
export const aiChats = mysqlTable("ai_chats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChat = typeof aiChats.$inferSelect;
export type InsertAiChat = typeof aiChats.$inferInsert;


/**
 * Vendors table - supplier/vendor management
 */
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  category: mysqlEnum("category", ["materials", "equipment", "labor", "services", "furniture", "fixtures", "electrical", "plumbing", "hvac", "other"]).default("other").notNull(),
  rating: int("rating").default(0),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

/**
 * Procurement items - items to be procured for projects
 */
export const procurementItems = mysqlTable("procurement_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["materials", "equipment", "labor", "services", "furniture", "fixtures", "electrical", "plumbing", "hvac", "other"]).default("other").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("pcs"),
  estimatedUnitCost: decimal("estimatedUnitCost", { precision: 15, scale: 2 }),
  actualUnitCost: decimal("actualUnitCost", { precision: 15, scale: 2 }),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }),
  status: mysqlEnum("status", ["pending", "quoted", "approved", "ordered", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  requiredDate: timestamp("requiredDate"),
  vendorId: int("vendorId"),
  specifications: text("specifications"),
  notes: text("notes"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcurementItem = typeof procurementItems.$inferSelect;
export type InsertProcurementItem = typeof procurementItems.$inferInsert;

/**
 * Purchase orders - orders placed with vendors
 */
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  vendorId: int("vendorId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "sent", "acknowledged", "shipped", "delivered", "cancelled"]).default("draft").notNull(),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  orderDate: timestamp("orderDate"),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  shippingAddress: text("shippingAddress"),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  notes: text("notes"),
  createdById: int("createdById").notNull(),
  approvedById: int("approvedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Purchase order items - line items in purchase orders
 */
export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  procurementItemId: int("procurementItemId"),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("pcs"),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }).notNull(),
  receivedQuantity: decimal("receivedQuantity", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

/**
 * Delivery records - tracking deliveries
 */
export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  projectId: int("projectId").notNull(),
  deliveryNumber: varchar("deliveryNumber", { length: 50 }),
  status: mysqlEnum("status", ["scheduled", "in_transit", "delivered", "partial", "rejected"]).default("scheduled").notNull(),
  scheduledDate: timestamp("scheduledDate"),
  actualDate: timestamp("actualDate"),
  receivedById: int("receivedById"),
  notes: text("notes"),
  attachments: json("attachments").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;


/**
 * Project baselines - snapshots of planned schedules
 */
export const projectBaselines = mysqlTable("project_baselines", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: int("version").default(1).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  plannedStartDate: timestamp("plannedStartDate").notNull(),
  plannedEndDate: timestamp("plannedEndDate").notNull(),
  plannedBudget: decimal("plannedBudget", { precision: 15, scale: 2 }),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectBaseline = typeof projectBaselines.$inferSelect;
export type InsertProjectBaseline = typeof projectBaselines.$inferInsert;

/**
 * Baseline tasks - planned task schedules in a baseline
 */
export const baselineTasks = mysqlTable("baseline_tasks", {
  id: int("id").autoincrement().primaryKey(),
  baselineId: int("baselineId").notNull(),
  taskId: int("taskId"),
  taskName: varchar("taskName", { length: 255 }).notNull(),
  plannedStartDate: timestamp("plannedStartDate"),
  plannedEndDate: timestamp("plannedEndDate"),
  plannedDuration: int("plannedDuration"),
  plannedProgress: int("plannedProgress").default(0),
  dependencies: json("dependencies").$type<number[]>(),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BaselineTask = typeof baselineTasks.$inferSelect;
export type InsertBaselineTask = typeof baselineTasks.$inferInsert;

/**
 * Schedule variances - tracking differences between planned and actual
 */
export const scheduleVariances = mysqlTable("schedule_variances", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  baselineId: int("baselineId").notNull(),
  taskId: int("taskId"),
  varianceType: mysqlEnum("varianceType", ["start_delay", "end_delay", "duration_change", "progress_variance"]).notNull(),
  plannedValue: varchar("plannedValue", { length: 255 }),
  actualValue: varchar("actualValue", { length: 255 }),
  varianceDays: int("varianceDays"),
  variancePercent: decimal("variancePercent", { precision: 5, scale: 2 }),
  impact: mysqlEnum("impact", ["low", "medium", "high", "critical"]).default("low").notNull(),
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type ScheduleVariance = typeof scheduleVariances.$inferSelect;
export type InsertScheduleVariance = typeof scheduleVariances.$inferInsert;

/**
 * Progress snapshots - periodic progress recordings
 */
export const progressSnapshots = mysqlTable("progress_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  baselineId: int("baselineId"),
  snapshotDate: timestamp("snapshotDate").notNull(),
  plannedProgress: int("plannedProgress").default(0),
  actualProgress: int("actualProgress").default(0),
  schedulePerformanceIndex: decimal("schedulePerformanceIndex", { precision: 5, scale: 2 }),
  costPerformanceIndex: decimal("costPerformanceIndex", { precision: 5, scale: 2 }),
  plannedValue: decimal("plannedValue", { precision: 15, scale: 2 }),
  earnedValue: decimal("earnedValue", { precision: 15, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;
export type InsertProgressSnapshot = typeof progressSnapshots.$inferInsert;


/**
 * Material List - tracking construction materials for projects
 */
export const materialList = mysqlTable("material_list", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "concrete", "steel", "paint", "electrical"
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // e.g., "kg", "m3", "liters", "pieces"
  estimatedUnitCost: decimal("estimatedUnitCost", { precision: 10, scale: 2 }),
  totalEstimatedCost: decimal("totalEstimatedCost", { precision: 15, scale: 2 }),
  supplier: varchar("supplier", { length: 255 }),
  specificationNotes: text("specificationNotes"),
  requiredDate: timestamp("requiredDate"),
  status: mysqlEnum("status", ["pending", "ordered", "delivered", "used", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  linkedProcurementItemId: int("linkedProcurementItemId"), // Link to procurement item
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaterialListItem = typeof materialList.$inferSelect;
export type InsertMaterialListItem = typeof materialList.$inferInsert;

/**
 * FF&E List - tracking furniture, fixtures & equipment for projects
 */
export const ffeList = mysqlTable("ffe_list", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "furniture", "fixtures", "equipment", "appliances"
  type: varchar("type", { length: 100 }), // e.g., "sofa", "lighting", "HVAC", "kitchen appliance"
  quantity: int("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).default("piece"),
  estimatedUnitCost: decimal("estimatedUnitCost", { precision: 10, scale: 2 }),
  totalEstimatedCost: decimal("totalEstimatedCost", { precision: 15, scale: 2 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  modelNumber: varchar("modelNumber", { length: 100 }),
  specificationNotes: text("specificationNotes"),
  installationNotes: text("installationNotes"),
  requiredDate: timestamp("requiredDate"),
  status: mysqlEnum("status", ["pending", "ordered", "delivered", "installed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  linkedProcurementItemId: int("linkedProcurementItemId"), // Link to procurement item
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FFEListItem = typeof ffeList.$inferSelect;
export type InsertFFEListItem = typeof ffeList.$inferInsert;


/**
 * Document Generation table - stores BOQ, Drawings, and generated project documents
 */
export const documentGenerations = mysqlTable("documentGenerations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  documentType: mysqlEnum("documentType", ["boq", "drawings", "baseline", "procurement_log", "engineering_log", "budget_estimation", "value_engineering", "other"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sourceDocumentIds: text("sourceDocumentIds"), // JSON array of document IDs used for generation
  generatedContent: text("generatedContent"), // Full generated document content
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  marketDataUsed: text("marketDataUsed"), // JSON object with Dubai market data used
  generationPrompt: text("generationPrompt"), // The prompt used for generation
  missingInformation: text("missingInformation"), // JSON array of missing info requested from user
  generatedAt: timestamp("generatedAt"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentGeneration = typeof documentGenerations.$inferSelect;
export type InsertDocumentGeneration = typeof documentGenerations.$inferInsert;

/**
 * Dubai Market Data table - stores construction market rates and pricing
 */
export const dubaiMarketData = mysqlTable("dubaiMarketData", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "labor", "materials", "equipment", "services"
  itemName: varchar("itemName", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  averagePrice: decimal("averagePrice", { precision: 10, scale: 2 }).notNull(),
  priceRange: varchar("priceRange", { length: 100 }), // e.g., "100-150"
  supplier: varchar("supplier", { length: 255 }),
  lastUpdated: timestamp("lastUpdated").defaultNow(),
  dataSource: varchar("dataSource", { length: 255 }), // e.g., "market_survey", "supplier_quote", "historical"
  marketPeriod: varchar("marketPeriod", { length: 50 }), // e.g., "Q4-2025"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DubaiMarketData = typeof dubaiMarketData.$inferSelect;
export type InsertDubaiMarketData = typeof dubaiMarketData.$inferInsert;

/**
 * Generated Document Artifacts table - stores individual generated documents
 */
export const generatedArtifacts = mysqlTable("generatedArtifacts", {
  id: int("id").autoincrement().primaryKey(),
  generationId: int("generationId").notNull(),
  projectId: int("projectId").notNull(),
  artifactType: varchar("artifactType", { length: 100 }).notNull(), // e.g., "baseline_schedule", "procurement_item", "budget_line"
  artifactData: text("artifactData"), // JSON data for the artifact
  linkedEntityId: int("linkedEntityId"), // Link to actual entity (e.g., baseline ID, procurement item ID)
  linkedEntityType: varchar("linkedEntityType", { length: 100 }), // e.g., "baseline", "procurement_item", "budget_item"
  status: mysqlEnum("status", ["generated", "reviewed", "approved", "rejected", "applied"]).default("generated").notNull(),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedArtifact = typeof generatedArtifacts.$inferSelect;
export type InsertGeneratedArtifact = typeof generatedArtifacts.$inferInsert;
