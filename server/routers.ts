import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { sprints, teamVelocity, workspaceStorage } from "../drizzle/schema";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { boqGapRouter } from "./routers/boqGapRouter";
import { suppliersRouter } from "./routers/suppliersRouter";
import { documentSharingRouter } from "./routers/documentSharingRouter";
import { supplierFavoritesRouter } from "./routers/supplierFavoritesRouter";

// Admin procedure - only allows admin users
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  boqGap: boqGapRouter,
  suppliers: suppliersRouter,
  documentSharing: documentSharingRouter,
  supplierFavorites: supplierFavoritesRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') {
        return db.getAllProjects();
      }
      return db.getProjectsForUser(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectById(input.id);
      }),
    
    stats: protectedProcedure.query(async () => {
      return db.getProjectStats();
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal('')),
        clientPhone: z.string().optional(),
        location: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('planning'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        budget: z.string().optional(),
        currency: z.string().default('USD'),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await db.createProject({
          ...input,
          budget: input.budget || undefined,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          createdById: ctx.user.id,
        });
        
        // Add creator as project manager
        await db.addProjectMember({
          projectId,
          userId: ctx.user.id,
          role: 'project_manager',
        });
        
        // Log activity
        await db.createActivityLog({
          projectId,
          userId: ctx.user.id,
          action: 'created',
          entityType: 'project',
          entityId: projectId,
          details: { name: input.name },
        });
        
        return { id: projectId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal('')),
        clientPhone: z.string().optional(),
        location: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        budget: z.string().optional(),
        currency: z.string().optional(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        progress: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        });
        
        await db.createActivityLog({
          projectId: id,
          userId: ctx.user.id,
          action: 'updated',
          entityType: 'project',
          entityId: id,
        });
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  projectMembers: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectMembers(input.projectId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(['project_manager', 'site_engineer', 'architect', 'contractor', 'consultant', 'viewer']),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addProjectMember(input);
        
        // Create notification for added member
        await db.createNotification({
          userId: input.userId,
          projectId: input.projectId,
          type: 'project_updated',
          title: 'Added to Project',
          message: `You have been added to a project as ${input.role}`,
          link: `/projects/${input.projectId}`,
        });
        
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ projectId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeProjectMember(input.projectId, input.userId);
        return { success: true };
      }),
  }),

  tasks: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getTasksByProject(input.projectId);
      }),
    
    myTasks: protectedProcedure.query(async ({ ctx }) => {
      return db.getTasksByAssignee(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTaskById(input.id);
      }),
    
    stats: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getTaskStats(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        parentTaskId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(['todo', 'in_progress', 'in_review', 'completed', 'cancelled']).default('todo'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        assigneeId: z.number().optional(),
        startDate: z.string().optional(),
        dueDate: z.string().optional(),
        estimatedHours: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const taskId = await db.createTask({
          ...input,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          createdById: ctx.user.id,
        });
        
        // Notify assignee
        if (input.assigneeId && input.assigneeId !== ctx.user.id) {
          await db.createNotification({
            userId: input.assigneeId,
            projectId: input.projectId,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned: ${input.title}`,
            link: `/projects/${input.projectId}/tasks/${taskId}`,
          });
        }
        
        await db.createActivityLog({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'created',
          entityType: 'task',
          entityId: taskId,
          details: { title: input.title },
        });
        
        return { id: taskId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(['todo', 'in_progress', 'in_review', 'completed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        assigneeId: z.number().optional().nullable(),
        startDate: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
        progress: z.number().min(0).max(100).optional(),
        estimatedHours: z.string().optional(),
        actualHours: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const task = await db.getTaskById(id);
        
        await db.updateTask(id, {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          completedAt: data.status === 'completed' ? new Date() : undefined,
        });
        
        if (task) {
          await db.createActivityLog({
            projectId: task.projectId,
            userId: ctx.user.id,
            action: 'updated',
            entityType: 'task',
            entityId: id,
            details: { status: data.status },
          });
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  taskComments: router({
    list: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return db.getTaskComments(input.taskId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createTaskComment({
          taskId: input.taskId,
          userId: ctx.user.id,
          content: input.content,
        });
        return { id: commentId };
      }),
  }),

  documents: router({
    list: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getDocumentsByProject(input.projectId, input.category);
      }),
    
    upload: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['drawing', 'contract', 'invoice', 'report', 'permit', 'photo', 'specification', 'other']),
        fileData: z.string(), // base64
        mimeType: z.string(),
        fileSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `projects/${input.projectId}/documents/${nanoid()}-${input.name}`;
        
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        const docId = await db.createDocument({
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          category: input.category,
          fileUrl: url,
          fileKey,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          uploadedById: ctx.user.id,
        });
        
        await db.createActivityLog({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'uploaded',
          entityType: 'document',
          entityId: docId,
          details: { name: input.name, category: input.category },
        });
        
        return { id: docId, url };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocument(input.id);
        return { success: true };
      }),
  }),

  budget: router({
    categories: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getBudgetCategoriesByProject(input.projectId);
      }),
    
    createCategory: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        allocatedAmount: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createBudgetCategory(input);
        return { id };
      }),
    
    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        allocatedAmount: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBudgetCategory(id, data);
        return { success: true };
      }),
    
    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBudgetCategory(input.id);
        return { success: true };
      }),
  }),

  expenses: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getExpensesByProject(input.projectId);
      }),
    
    stats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getExpenseStats(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        categoryId: z.number().optional(),
        description: z.string().min(1),
        amount: z.string(),
        vendor: z.string().optional(),
        invoiceNumber: z.string().optional(),
        expenseDate: z.string(),
        status: z.enum(['pending', 'approved', 'rejected', 'paid']).default('pending'),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createExpense({
          ...input,
          expenseDate: new Date(input.expenseDate),
          createdById: ctx.user.id,
        });
        
        await db.createActivityLog({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'created',
          entityType: 'expense',
          entityId: id,
          details: { amount: input.amount, description: input.description },
        });
        
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional().nullable(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        vendor: z.string().optional(),
        invoiceNumber: z.string().optional(),
        expenseDate: z.string().optional(),
        status: z.enum(['pending', 'approved', 'rejected', 'paid']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateExpense(id, {
          ...data,
          expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
          approvedById: data.status === 'approved' ? ctx.user.id : undefined,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteExpense(input.id);
        return { success: true };
      }),
  }),

  milestones: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getMilestonesByProject(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string(),
        status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).default('pending'),
        color: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMilestone({
          ...input,
          dueDate: new Date(input.dueDate),
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        completedDate: z.string().optional().nullable(),
        status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).optional(),
        color: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMilestone(id, {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMilestone(input.id);
        return { success: true };
      }),
  }),

  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return db.getNotificationsForUser(ctx.user.id, input.limit);
      }),
    
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
    
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  activities: router({
    byProject: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return db.getActivityLogsByProject(input.projectId, input.limit);
      }),
    
    recent: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        return db.getRecentActivities(ctx.user.id, input.limit);
      }),
  }),

  ai: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        await db.createAiChat({
          userId: ctx.user.id,
          projectId: input.projectId,
          role: 'user',
          content: input.message,
        });
        
        // Get project context if projectId provided
        let projectContext = '';
        if (input.projectId) {
          const project = await db.getProjectById(input.projectId);
          const tasks = await db.getTasksByProject(input.projectId);
          const milestones = await db.getMilestonesByProject(input.projectId);
          
          if (project) {
            projectContext = `
Current Project Context:
- Name: ${project.name}
- Status: ${project.status}
- Budget: ${project.budget} ${project.currency}
- Progress: ${project.progress}%
- Start Date: ${project.startDate}
- End Date: ${project.endDate}
- Total Tasks: ${tasks.length}
- Completed Tasks: ${tasks.filter(t => t.status === 'completed').length}
- Milestones: ${milestones.length}
`;
          }
        }
        
        // Get chat history
        const history = await db.getAiChatHistory(ctx.user.id, input.projectId, 10);
        
        const messages = [
          {
            role: 'system' as const,
            content: `You are an AI assistant for a construction project management platform called Fit-Out Dashboard. 
You help project managers, engineers, and contractors with:
- Project planning and scheduling advice
- Budget optimization and cost control suggestions
- Task prioritization and resource allocation
- Risk identification and mitigation strategies
- Progress reporting and status updates
- Best practices for construction project management

Be concise, professional, and actionable in your responses.
${projectContext}`,
          },
          ...history.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
          { role: 'user' as const, content: input.message },
        ];
        
        const response = await invokeLLM({ messages });
        const rawContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof rawContent === 'string' ? rawContent : 'I apologize, but I was unable to generate a response.';
        
        // Save assistant response
        await db.createAiChat({
          userId: ctx.user.id,
          projectId: input.projectId,
          role: 'assistant',
          content: assistantMessage,
        });
        
        return { message: assistantMessage };
      }),
    
    history: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getAiChatHistory(ctx.user.id, input.projectId);
      }),
    
    clearHistory: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.clearAiChatHistory(ctx.user.id, input.projectId);
        return { success: true };
      }),
    
    generateSummary: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        const tasks = await db.getTasksByProject(input.projectId);
        const milestones = await db.getMilestonesByProject(input.projectId);
        const expenses = await db.getExpensesByProject(input.projectId);
        
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a construction project analyst. Generate a concise executive summary based on the project data provided.',
            },
            {
              role: 'user',
              content: `Generate an executive summary for this project:
              
Project: ${project.name}
Status: ${project.status}
Budget: ${project.budget} ${project.currency}
Spent: ${totalExpenses} ${project.currency}
Progress: ${project.progress}%
Timeline: ${project.startDate} to ${project.endDate}

Tasks: ${tasks.length} total, ${completedTasks} completed, ${overdueTasks} overdue
Milestones: ${milestones.length} total, ${milestones.filter(m => m.status === 'completed').length} completed

Provide:
1. Overall status assessment
2. Budget health
3. Schedule status
4. Key risks or concerns
5. Recommended next steps`,
            },
          ],
        });
        
        const summaryContent = response.choices[0]?.message?.content;
        return { summary: typeof summaryContent === 'string' ? summaryContent : '' };
      }),
    
    generateWeeklyReport: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        const tasks = await db.getTasksByProject(input.projectId);
        const milestones = await db.getMilestonesByProject(input.projectId);
        const expenses = await db.getExpensesByProject(input.projectId);
        const members = await db.getProjectMembers(input.projectId);
        
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // Calculate date range for this week
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // ============ RESOURCE ALLOCATION CALCULATIONS ============
        // Calculate task distribution per team member
        const resourceAllocation = members.map((member: any) => {
          const memberTasks = tasks.filter(t => t.assigneeId === member.userId);
          const completedTasks = memberTasks.filter(t => t.status === 'completed');
          const inProgressTasks = memberTasks.filter(t => t.status === 'in_progress');
          const todoTasks = memberTasks.filter(t => t.status === 'todo');
          const overdueMemberTasks = memberTasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed'
          );
          const tasksCompletedThisWeekByMember = memberTasks.filter(t => 
            t.status === 'completed' && t.updatedAt && new Date(t.updatedAt) >= weekAgo
          );
          
          // Calculate utilization (tasks in progress + todo as percentage of capacity)
          // Assume each member has capacity for 10 active tasks
          const activeTaskCount = inProgressTasks.length + todoTasks.length;
          const utilizationRate = Math.min((activeTaskCount / 10) * 100, 100);
          
          return {
            userId: member.userId,
            name: member.userName || 'Unknown',
            role: member.role,
            totalAssigned: memberTasks.length,
            completed: completedTasks.length,
            inProgress: inProgressTasks.length,
            todo: todoTasks.length,
            overdue: overdueMemberTasks.length,
            completedThisWeek: tasksCompletedThisWeekByMember.length,
            utilizationRate: Math.round(utilizationRate),
          };
        });
        
        // Calculate overall resource metrics
        const totalTeamMembers = members.length;
        const totalAssignedTasks = tasks.filter(t => t.assigneeId).length;
        const unassignedTasks = tasks.filter(t => !t.assigneeId).length;
        const avgTasksPerMember = totalTeamMembers > 0 ? Math.round(totalAssignedTasks / totalTeamMembers) : 0;
        const avgUtilization = totalTeamMembers > 0 
          ? Math.round(resourceAllocation.reduce((sum, r) => sum + r.utilizationRate, 0) / totalTeamMembers)
          : 0;
        
        // Identify overloaded and underutilized members
        const overloadedMembers = resourceAllocation.filter(r => r.utilizationRate > 80);
        const underutilizedMembers = resourceAllocation.filter(r => r.utilizationRate < 30 && r.totalAssigned > 0);
        
        // Filter tasks completed this week
        const tasksCompletedThisWeek = tasks.filter(t => 
          t.status === 'completed' && 
          t.updatedAt && 
          new Date(t.updatedAt) >= weekAgo
        );
        
        // Filter tasks in progress
        const tasksInProgress = tasks.filter(t => t.status === 'in_progress');
        
        // Filter overdue tasks
        const overdueTasks = tasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) < today && 
          t.status !== 'completed'
        );
        
        // Upcoming tasks (due in next 7 days)
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingTasks = tasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) >= today && 
          new Date(t.dueDate) <= nextWeek &&
          t.status !== 'completed'
        );
        
        // Upcoming milestones
        const upcomingMilestones = milestones.filter(m => 
          m.dueDate && 
          new Date(m.dueDate) >= today && 
          new Date(m.dueDate) <= nextWeek &&
          m.status !== 'completed'
        );
        
        // Budget calculations
        const totalBudget = parseFloat(project.budget || '0');
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const budgetUtilization = totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(1) : '0';
        const remainingBudget = totalBudget - totalExpenses;
        
        // Expenses this week
        const expensesThisWeek = expenses.filter(e => 
          e.expenseDate && new Date(e.expenseDate) >= weekAgo
        );
        const weeklySpending = expensesThisWeek.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        const reportDate = today.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are a professional construction project manager creating a weekly progress report. 
Generate a comprehensive, well-structured weekly report in Markdown format.
Be specific with numbers and data provided. Include actionable insights and recommendations.
Use professional language suitable for stakeholders and clients.`,
            },
            {
              role: 'user',
              content: `Generate a Weekly Progress Report for the following project:

**REPORT DATE:** ${reportDate}
**REPORTING PERIOD:** ${weekAgo.toLocaleDateString()} - ${today.toLocaleDateString()}

**PROJECT INFORMATION:**
- Project Name: ${project.name}
- Client: ${project.clientName || 'N/A'}
- Location: ${project.location || 'N/A'}
- Current Status: ${project.status}
- Overall Progress: ${project.progress}%
- Project Timeline: ${project.startDate} to ${project.endDate}

**TEAM:**
- Total Team Members: ${members.length}
- Team Roles: ${members.map((m: any) => m.role).join(', ') || 'N/A'}

**RESOURCE ALLOCATION & UTILIZATION:**
- Total Assigned Tasks: ${totalAssignedTasks}
- Unassigned Tasks: ${unassignedTasks}
- Average Tasks per Member: ${avgTasksPerMember}
- Average Team Utilization: ${avgUtilization}%
- Overloaded Members (>80% utilization): ${overloadedMembers.length}
- Underutilized Members (<30% utilization): ${underutilizedMembers.length}

**Team Member Workload:**
${resourceAllocation.map(r => `- ${r.name} (${r.role}): ${r.totalAssigned} tasks (${r.completed} done, ${r.inProgress} in progress, ${r.todo} pending, ${r.overdue} overdue) - ${r.utilizationRate}% utilized, ${r.completedThisWeek} completed this week`).join('\n') || '- No team members assigned'}

**Resource Concerns:**
${overloadedMembers.length > 0 ? `- Overloaded: ${overloadedMembers.map(r => r.name).join(', ')} - consider redistributing tasks` : '- No overloaded team members'}
${underutilizedMembers.length > 0 ? `\n- Underutilized: ${underutilizedMembers.map(r => r.name).join(', ')} - available for additional assignments` : ''}
${unassignedTasks > 0 ? `\n- ${unassignedTasks} tasks need to be assigned to team members` : ''}

**TASK SUMMARY:**
- Total Tasks: ${tasks.length}
- Completed This Week: ${tasksCompletedThisWeek.length}
- Currently In Progress: ${tasksInProgress.length}
- Overdue Tasks: ${overdueTasks.length}
- Tasks Due Next Week: ${upcomingTasks.length}

**Tasks Completed This Week:**
${tasksCompletedThisWeek.map(t => `- ${t.title}`).join('\n') || '- None'}

**Tasks In Progress:**
${tasksInProgress.slice(0, 5).map(t => `- ${t.title} (${t.priority} priority)`).join('\n') || '- None'}

**Overdue Tasks (Attention Required):**
${overdueTasks.map(t => `- ${t.title} (Due: ${t.dueDate})`).join('\n') || '- None'}

**MILESTONE STATUS:**
- Total Milestones: ${milestones.length}
- Completed: ${milestones.filter(m => m.status === 'completed').length}
- Upcoming This Week: ${upcomingMilestones.length}

**Upcoming Milestones:**
${upcomingMilestones.map(m => `- ${m.name} (Due: ${m.dueDate})`).join('\n') || '- None in the next 7 days'}

**FINANCIAL SUMMARY:**
- Total Budget: ${project.currency} ${totalBudget.toLocaleString()}
- Total Spent: ${project.currency} ${totalExpenses.toLocaleString()}
- Remaining Budget: ${project.currency} ${remainingBudget.toLocaleString()}
- Budget Utilization: ${budgetUtilization}%
- Spending This Week: ${project.currency} ${weeklySpending.toLocaleString()}

Please generate a professional weekly report with the following sections:
1. **Executive Summary** (2-3 sentences overview)
2. **Progress Highlights** (key accomplishments this week)
3. **Work in Progress** (current activities)
4. **Resource Allocation & Utilization** (team workload analysis, identify overloaded/underutilized members, recommendations for task redistribution)
5. **Issues & Risks** (any concerns or blockers, including resource-related risks)
6. **Financial Status** (budget health assessment)
7. **Next Week's Priorities** (planned activities)
8. **Recommendations** (actionable suggestions including resource optimization)

Format the report professionally with clear headings and bullet points where appropriate.`,
            },
          ],
        });
        
        const reportContent = response.choices[0]?.message?.content;
        
        return { 
          report: typeof reportContent === 'string' ? reportContent : 'Unable to generate report',
          metadata: {
            projectName: project.name,
            reportDate: reportDate,
            periodStart: weekAgo.toISOString(),
            periodEnd: today.toISOString(),
            tasksCompleted: tasksCompletedThisWeek.length,
            tasksInProgress: tasksInProgress.length,
            overdueTasks: overdueTasks.length,
            budgetUtilization: parseFloat(budgetUtilization),
            weeklySpending: weeklySpending,
            // Resource allocation metrics
            totalTeamMembers: totalTeamMembers,
            avgUtilization: avgUtilization,
            overloadedMembers: overloadedMembers.length,
            underutilizedMembers: underutilizedMembers.length,
            unassignedTasks: unassignedTasks,
            resourceAllocation: resourceAllocation,
          }
        };
      }),
  }),

  // ============ VENDOR ROUTER ============
  vendors: router({
    list: protectedProcedure.query(async () => {
      return db.getVendors();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVendorById(input.id);
      }),
    
    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return db.getVendorsByCategory(input.category);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        category: z.enum(['materials', 'equipment', 'labor', 'services', 'furniture', 'fixtures', 'electrical', 'plumbing', 'hvac', 'other']),
        rating: z.number().min(0).max(5).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createVendor({
          ...input,
          createdById: ctx.user.id,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        category: z.enum(['materials', 'equipment', 'labor', 'services', 'furniture', 'fixtures', 'electrical', 'plumbing', 'hvac', 'other']).optional(),
        rating: z.number().min(0).max(5).optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVendor(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVendor(input.id);
        return { success: true };
      }),
  }),

  // ============ PROCUREMENT ROUTER ============
  procurement: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProcurementItemsByProject(input.projectId);
      }),
    
    stats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProcurementStats(input.projectId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProcurementItemById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['materials', 'equipment', 'labor', 'services', 'furniture', 'fixtures', 'electrical', 'plumbing', 'hvac', 'other']),
        quantity: z.string(),
        unit: z.string().default('pcs'),
        estimatedUnitCost: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        requiredDate: z.string().optional(),
        vendorId: z.number().optional(),
        specifications: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const totalCost = input.estimatedUnitCost 
          ? (parseFloat(input.quantity) * parseFloat(input.estimatedUnitCost)).toString()
          : undefined;
        
        const id = await db.createProcurementItem({
          ...input,
          totalCost,
          requiredDate: input.requiredDate ? new Date(input.requiredDate) : undefined,
          createdById: ctx.user.id,
        });
        
        await db.createActivityLog({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'created',
          entityType: 'procurement',
          entityId: id,
          details: { name: input.name, category: input.category },
        });
        
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.enum(['materials', 'equipment', 'labor', 'services', 'furniture', 'fixtures', 'electrical', 'plumbing', 'hvac', 'other']).optional(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        estimatedUnitCost: z.string().optional(),
        actualUnitCost: z.string().optional(),
        status: z.enum(['pending', 'quoted', 'approved', 'ordered', 'shipped', 'delivered', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        requiredDate: z.string().optional(),
        vendorId: z.number().optional().nullable(),
        specifications: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // Calculate total cost if quantity and unit cost are provided
        let totalCost: string | undefined;
        if (data.quantity && data.actualUnitCost) {
          totalCost = (parseFloat(data.quantity) * parseFloat(data.actualUnitCost)).toString();
        } else if (data.quantity && data.estimatedUnitCost) {
          totalCost = (parseFloat(data.quantity) * parseFloat(data.estimatedUnitCost)).toString();
        }
        
        await db.updateProcurementItem(id, {
          ...data,
          totalCost,
          requiredDate: data.requiredDate ? new Date(data.requiredDate) : undefined,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProcurementItem(input.id);
        return { success: true };
      }),
    
    // AI-powered procurement list generation
    generateList: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are a construction procurement specialist. Generate a detailed procurement list based on the project requirements. Return a JSON array of items with the following structure:
[
  {
    "name": "Item name",
    "description": "Brief description",
    "category": "materials|equipment|labor|services|furniture|fixtures|electrical|plumbing|hvac|other",
    "quantity": "number",
    "unit": "pcs|m|m2|m3|kg|set|lot|etc",
    "estimatedUnitCost": "number",
    "priority": "low|medium|high|critical",
    "leadTimeDays": "number",
    "specifications": "technical specs if any"
  }
]
Only return the JSON array, no other text.`,
            },
            {
              role: 'user',
              content: `Generate a procurement list for this fit-out project:

Project: ${project.name}
Location: ${project.location || 'Not specified'}
Budget: ${project.budget} ${project.currency}

Requirements:
${input.description}`,
            },
          ],
        });
        
        const content = response.choices[0]?.message?.content;
        try {
          const items = JSON.parse(typeof content === 'string' ? content : '[]');
          return { items };
        } catch {
          return { items: [], error: 'Failed to parse AI response' };
        }
      }),
    
    // AI vendor suggestion
    suggestVendors: protectedProcedure
      .input(z.object({
        itemId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const item = await db.getProcurementItemById(input.itemId);
        if (!item) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
        }
        
        // Get vendors in the same category
        const vendors = await db.getVendorsByCategory(item.category);
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a procurement advisor. Analyze the item requirements and available vendors to provide recommendations. Return a JSON object with vendor rankings and reasoning.',
            },
            {
              role: 'user',
              content: `Recommend vendors for this procurement item:

Item: ${item.name}
Category: ${item.category}
Quantity: ${item.quantity} ${item.unit}
Specifications: ${item.specifications || 'None specified'}

Available vendors:
${vendors.map(v => `- ${v.name} (Rating: ${v.rating}/5, Contact: ${v.contactPerson || 'N/A'})`).join('\n')}

Provide recommendations with reasoning.`,
            },
          ],
        });
        
        const content = response.choices[0]?.message?.content;
        return { 
          recommendations: typeof content === 'string' ? content : '',
          availableVendors: vendors,
        };
      }),
    
    // AI alternative vendor suggestion based on price and availability
    suggestAlternativeVendors: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        currentVendorId: z.number().optional(),
        prioritizeFactor: z.enum(['price', 'availability', 'balanced']).default('balanced'),
      }))
      .mutation(async ({ input }) => {
        const item = await db.getProcurementItemById(input.itemId);
        if (!item) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
        }
        
        // Get all vendors (not just same category) for alternatives
        const allVendors = await db.getVendors();
        const categoryVendors = allVendors.filter(v => v.category === item.category || v.category === 'other');
        
        // Get current vendor info if specified
        let currentVendor = null;
        if (input.currentVendorId) {
          currentVendor = await db.getVendorById(input.currentVendorId);
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an expert procurement analyst specializing in construction and fit-out projects. Your task is to suggest alternative vendors based on price competitiveness and availability.

Analyze the procurement item and available vendors, then provide:
1. A ranked list of alternative vendors with estimated price ranges and availability scores
2. Specific recommendations for each vendor
3. Risk assessment for switching vendors
4. Potential cost savings analysis

Return your response in this JSON format:
{
  "alternatives": [
    {
      "vendorName": "string",
      "vendorId": number,
      "estimatedPriceRange": { "low": number, "high": number },
      "availabilityScore": number (1-10),
      "leadTimeDays": number,
      "recommendation": "string",
      "pros": ["string"],
      "cons": ["string"],
      "overallScore": number (1-100)
    }
  ],
  "currentVendorAnalysis": "string" (if current vendor provided),
  "potentialSavings": { "percentage": number, "amount": number },
  "riskAssessment": "low|medium|high",
  "recommendation": "string"
}

Only return valid JSON, no additional text.`,
            },
            {
              role: 'user',
              content: `Find alternative vendors for this procurement item:

**Item Details:**
- Name: ${item.name}
- Category: ${item.category}
- Quantity: ${item.quantity} ${item.unit}
- Estimated Unit Cost: ${item.estimatedUnitCost || 'Not specified'}
- Total Budget: ${item.totalCost || 'Not calculated'}
- Required Date: ${item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : 'Not specified'}
- Specifications: ${item.specifications || 'None specified'}
- Priority: ${item.priority}

**Current Vendor:** ${currentVendor ? `${currentVendor.name} (Rating: ${currentVendor.rating}/5)` : 'None assigned'}

**Prioritization Factor:** ${input.prioritizeFactor}
${input.prioritizeFactor === 'price' ? '(Focus on finding the most cost-effective options)' : ''}
${input.prioritizeFactor === 'availability' ? '(Focus on vendors with fastest delivery and best stock availability)' : ''}
${input.prioritizeFactor === 'balanced' ? '(Balance between price and availability)' : ''}

**Available Vendors:**
${categoryVendors.map(v => `- ID: ${v.id}, Name: ${v.name}, Category: ${v.category}, Rating: ${v.rating || 'N/A'}/5, Contact: ${v.contactPerson || 'N/A'}, Email: ${v.email || 'N/A'}, Phone: ${v.phone || 'N/A'}, Address: ${v.address || 'N/A'}, Notes: ${v.notes || 'None'}`).join('\n')}

Provide alternative vendor suggestions with price and availability analysis.`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'vendor_alternatives',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  alternatives: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        vendorName: { type: 'string' },
                        vendorId: { type: 'number' },
                        estimatedPriceRange: {
                          type: 'object',
                          properties: {
                            low: { type: 'number' },
                            high: { type: 'number' },
                          },
                          required: ['low', 'high'],
                          additionalProperties: false,
                        },
                        availabilityScore: { type: 'number' },
                        leadTimeDays: { type: 'number' },
                        recommendation: { type: 'string' },
                        pros: { type: 'array', items: { type: 'string' } },
                        cons: { type: 'array', items: { type: 'string' } },
                        overallScore: { type: 'number' },
                      },
                      required: ['vendorName', 'vendorId', 'estimatedPriceRange', 'availabilityScore', 'leadTimeDays', 'recommendation', 'pros', 'cons', 'overallScore'],
                      additionalProperties: false,
                    },
                  },
                  currentVendorAnalysis: { type: 'string' },
                  potentialSavings: {
                    type: 'object',
                    properties: {
                      percentage: { type: 'number' },
                      amount: { type: 'number' },
                    },
                    required: ['percentage', 'amount'],
                    additionalProperties: false,
                  },
                  riskAssessment: { type: 'string' },
                  recommendation: { type: 'string' },
                },
                required: ['alternatives', 'currentVendorAnalysis', 'potentialSavings', 'riskAssessment', 'recommendation'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const content = response.choices[0]?.message?.content;
        try {
          const result = JSON.parse(typeof content === 'string' ? content : '{}');
          return {
            ...result,
            item: {
              id: item.id,
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              unit: item.unit,
              estimatedUnitCost: item.estimatedUnitCost,
            },
            currentVendor: currentVendor ? {
              id: currentVendor.id,
              name: currentVendor.name,
              rating: currentVendor.rating,
            } : null,
            availableVendors: categoryVendors,
          };
        } catch {
          return {
            alternatives: [],
            currentVendorAnalysis: '',
            potentialSavings: { percentage: 0, amount: 0 },
            riskAssessment: 'unknown',
            recommendation: 'Failed to analyze vendors. Please try again.',
            item: {
              id: item.id,
              name: item.name,
              category: item.category,
            },
            currentVendor: null,
            availableVendors: categoryVendors,
            error: 'Failed to parse AI response',
          };
        }
      }),
  }),

  // ============ PURCHASE ORDER ROUTER ============
  purchaseOrders: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getPurchaseOrdersByProject(input.projectId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPurchaseOrderById(input.id);
      }),
    
    getItems: protectedProcedure
      .input(z.object({ purchaseOrderId: z.number() }))
      .query(async ({ input }) => {
        return db.getPurchaseOrderItems(input.purchaseOrderId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        vendorId: z.number(),
        orderNumber: z.string(),
        expectedDeliveryDate: z.string().optional(),
        shippingAddress: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(z.object({
          procurementItemId: z.number().optional(),
          description: z.string(),
          quantity: z.string(),
          unit: z.string(),
          unitPrice: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { items, ...orderData } = input;
        
        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => {
          return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
        }, 0).toString();
        
        const orderId = await db.createPurchaseOrder({
          ...orderData,
          totalAmount,
          expectedDeliveryDate: orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate) : undefined,
          createdById: ctx.user.id,
        });
        
        // Create order items
        for (const item of items) {
          await db.createPurchaseOrderItem({
            purchaseOrderId: orderId,
            procurementItemId: item.procurementItemId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toString(),
          });
          
          // Update procurement item status if linked
          if (item.procurementItemId) {
            await db.updateProcurementItem(item.procurementItemId, { status: 'ordered' });
          }
        }
        
        await db.createActivityLog({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'created',
          entityType: 'purchase_order',
          entityId: orderId,
          details: { orderNumber: input.orderNumber, totalAmount },
        });
        
        return { id: orderId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'shipped', 'delivered', 'cancelled']).optional(),
        expectedDeliveryDate: z.string().optional(),
        actualDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updatePurchaseOrder(id, {
          ...data,
          expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
          actualDeliveryDate: data.actualDeliveryDate ? new Date(data.actualDeliveryDate) : undefined,
          approvedById: data.status === 'approved' ? ctx.user.id : undefined,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePurchaseOrder(input.id);
        return { success: true };
      }),
  }),

  // ============ DELIVERY ROUTER ============
  deliveries: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getDeliveriesByProject(input.projectId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        purchaseOrderId: z.number(),
        projectId: z.number(),
        deliveryNumber: z.string().optional(),
        scheduledDate: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDelivery({
          ...input,
          scheduledDate: new Date(input.scheduledDate),
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['scheduled', 'in_transit', 'delivered', 'partial', 'rejected']).optional(),
        actualDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateDelivery(id, {
          ...data,
          actualDate: data.actualDate ? new Date(data.actualDate) : undefined,
          receivedById: data.status === 'delivered' ? ctx.user.id : undefined,
        });
        return { success: true };
      }),
  }),

  // ============ BASELINE ROUTER ============
  baseline: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getBaselinesByProject(input.projectId);
      }),
    
    getActive: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const baseline = await db.getActiveBaseline(input.projectId);
        return baseline ?? null;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const baseline = await db.getBaselineById(input.id);
        return baseline ?? null;
      }),
    
    getTasks: protectedProcedure
      .input(z.object({ baselineId: z.number() }))
      .query(async ({ input }) => {
        return db.getBaselineTasks(input.baselineId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        plannedStartDate: z.string(),
        plannedEndDate: z.string(),
        plannedBudget: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Deactivate existing active baselines
        const existingBaselines = await db.getBaselinesByProject(input.projectId);
        for (const baseline of existingBaselines) {
          if (baseline.isActive) {
            await db.updateBaseline(baseline.id, { isActive: false });
          }
        }
        
        // Get current version number
        const version = existingBaselines.length + 1;
        
        const id = await db.createBaseline({
          ...input,
          version,
          plannedStartDate: new Date(input.plannedStartDate),
          plannedEndDate: new Date(input.plannedEndDate),
          createdById: ctx.user.id,
        });
        
        // Copy current tasks as baseline tasks
        const tasks = await db.getTasksByProject(input.projectId);
        const baselineTasks = tasks.map((task, index) => ({
          baselineId: id,
          taskId: task.id,
          taskName: task.title,
          plannedStartDate: task.startDate,
          plannedEndDate: task.dueDate,
          plannedProgress: task.progress || 0,
          order: index,
        }));
        
        if (baselineTasks.length > 0) {
          await db.createBaselineTasks(baselineTasks);
        }
        
        await db.createActivityLog({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'created',
          entityType: 'baseline',
          entityId: id,
          details: { name: input.name, version },
        });
        
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBaseline(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBaselineTasks(input.id);
        await db.deleteBaseline(input.id);
        return { success: true };
      }),
    
    // Get variance analysis
    getVariances: protectedProcedure
      .input(z.object({ projectId: z.number(), baselineId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getScheduleVariances(input.projectId, input.baselineId);
      }),
    
    // Calculate and record variances
    calculateVariances: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const baseline = await db.getActiveBaseline(input.projectId);
        if (!baseline) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No active baseline found' });
        }
        
        const baselineTasks = await db.getBaselineTasks(baseline.id);
        const currentTasks = await db.getTasksByProject(input.projectId);
        const variances: any[] = [];
        
        for (const bt of baselineTasks) {
          const currentTask = currentTasks.find(t => t.id === bt.taskId);
          if (!currentTask) continue;
          
          // Check start date variance
          if (bt.plannedStartDate && currentTask.startDate) {
            const plannedStart = new Date(bt.plannedStartDate);
            const actualStart = new Date(currentTask.startDate);
            const daysDiff = Math.round((actualStart.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff !== 0) {
              const varianceId = await db.createScheduleVariance({
                projectId: input.projectId,
                baselineId: baseline.id,
                taskId: currentTask.id,
                varianceType: 'start_delay',
                plannedValue: bt.plannedStartDate.toISOString(),
                actualValue: currentTask.startDate.toISOString(),
                varianceDays: daysDiff,
                impact: Math.abs(daysDiff) > 7 ? 'high' : Math.abs(daysDiff) > 3 ? 'medium' : 'low',
              });
              variances.push({ id: varianceId, type: 'start_delay', days: daysDiff });
            }
          }
          
          // Check progress variance
          if (bt.plannedProgress !== undefined && currentTask.progress !== undefined) {
            const progressDiff = (currentTask.progress || 0) - (bt.plannedProgress || 0);
            if (Math.abs(progressDiff) > 10) {
              const varianceId = await db.createScheduleVariance({
                projectId: input.projectId,
                baselineId: baseline.id,
                taskId: currentTask.id,
                varianceType: 'progress_variance',
                plannedValue: bt.plannedProgress?.toString() || '0',
                actualValue: currentTask.progress?.toString() || '0',
                variancePercent: progressDiff.toString(),
                impact: Math.abs(progressDiff) > 30 ? 'high' : Math.abs(progressDiff) > 15 ? 'medium' : 'low',
              });
              variances.push({ id: varianceId, type: 'progress_variance', percent: progressDiff });
            }
          }
        }
        
        return { variances, count: variances.length };
      }),
    
    // Get progress snapshots
    getSnapshots: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getProgressSnapshots(input.projectId);
      }),
    
    // Record progress snapshot
    recordSnapshot: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        const baseline = await db.getActiveBaseline(input.projectId);
        const tasks = await db.getTasksByProject(input.projectId);
        const expenses = await db.getExpensesByProject(input.projectId);
        
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        // Calculate actual progress
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const actualProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
        
        // Calculate planned progress based on timeline
        let plannedProgress = 0;
        if (project.startDate && project.endDate) {
          const start = new Date(project.startDate).getTime();
          const end = new Date(project.endDate).getTime();
          const now = Date.now();
          const totalDuration = end - start;
          const elapsed = now - start;
          plannedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
        }
        
        // Calculate costs
        const actualCost = expenses.reduce((sum, e) => sum + parseFloat(e.amount as any || '0'), 0);
        const plannedValue = project.budget ? parseFloat(project.budget as any) * (plannedProgress / 100) : 0;
        const earnedValue = project.budget ? parseFloat(project.budget as any) * (actualProgress / 100) : 0;
        
        // Calculate performance indices
        const spi = plannedProgress > 0 ? (actualProgress / plannedProgress) : 1;
        const cpi = actualCost > 0 ? (earnedValue / actualCost) : 1;
        
        const id = await db.createProgressSnapshot({
          projectId: input.projectId,
          baselineId: baseline?.id,
          snapshotDate: new Date(),
          plannedProgress,
          actualProgress,
          schedulePerformanceIndex: spi.toFixed(2),
          costPerformanceIndex: cpi.toFixed(2),
          plannedValue: plannedValue.toString(),
          earnedValue: earnedValue.toString(),
          actualCost: actualCost.toString(),
          notes: input.notes,
        });
        
        return { id, spi, cpi, actualProgress, plannedProgress };
      }),
    
    // AI schedule optimization
    analyzeSchedule: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        const baseline = await db.getActiveBaseline(input.projectId);
        const tasks = await db.getTasksByProject(input.projectId);
        const snapshots = await db.getProgressSnapshots(input.projectId);
        
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a construction project scheduling expert. Analyze the project schedule and provide optimization recommendations.',
            },
            {
              role: 'user',
              content: `Analyze this project schedule and provide recommendations:

Project: ${project.name}
Status: ${project.status}
Timeline: ${project.startDate} to ${project.endDate}
Progress: ${project.progress}%

Baseline: ${baseline ? `v${baseline.version} - ${baseline.name}` : 'No baseline set'}

Tasks (${tasks.length} total):
${tasks.slice(0, 20).map(t => `- ${t.title}: ${t.status}, Due: ${t.dueDate}, Progress: ${t.progress}%`).join('\n')}

Recent Performance:
${snapshots.slice(-5).map(s => `- ${s.snapshotDate}: SPI=${s.schedulePerformanceIndex}, CPI=${s.costPerformanceIndex}`).join('\n')}

Provide:
1. Schedule health assessment
2. Critical path analysis
3. Risk areas
4. Optimization recommendations
5. Recovery strategies if behind schedule`,
            },
          ],
        });
        
        const content = response.choices[0]?.message?.content;
        return { analysis: typeof content === 'string' ? content : '' };
      }),
  }),

  // Material List Router
  materials: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getMaterialItems(input.projectId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMaterialItemById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        category: z.string(),
        quantity: z.number(),
        unit: z.string(),
        estimatedUnitCost: z.number().optional(),
        totalEstimatedCost: z.number().optional(),
        supplier: z.string().optional(),
        specificationNotes: z.string().optional(),
        requiredDate: z.date().optional(),
        status: z.enum(['pending', 'ordered', 'delivered', 'used', 'cancelled']).default('pending'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      }))
      .mutation(async ({ input, ctx }) => {
        // Convert numeric fields to strings for database storage
        const dbInput: any = { ...input, createdById: ctx.user.id };
        if (dbInput.estimatedUnitCost !== undefined) {
          dbInput.estimatedUnitCost = dbInput.estimatedUnitCost?.toString();
        }
        if (dbInput.totalEstimatedCost !== undefined) {
          dbInput.totalEstimatedCost = dbInput.totalEstimatedCost?.toString();
        }
        const id = await db.createMaterialItem(dbInput);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        estimatedUnitCost: z.number().optional(),
        totalEstimatedCost: z.number().optional(),
        supplier: z.string().optional(),
        specificationNotes: z.string().optional(),
        requiredDate: z.date().optional(),
        status: z.enum(['pending', 'ordered', 'delivered', 'used', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        linkedProcurementItemId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        // Convert numeric fields to strings for database storage
        const dbUpdates: any = { ...updates };
        if (dbUpdates.estimatedUnitCost !== undefined) {
          dbUpdates.estimatedUnitCost = dbUpdates.estimatedUnitCost?.toString();
        }
        if (dbUpdates.totalEstimatedCost !== undefined) {
          dbUpdates.totalEstimatedCost = dbUpdates.totalEstimatedCost?.toString();
        }
        await db.updateMaterialItem(id, dbUpdates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMaterialItem(input.id);
        return { success: true };
      }),
  }),

  // FF&E List Router
  ffe: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getFFEItems(input.projectId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getFFEItemById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        category: z.string(),
        type: z.string().optional(),
        quantity: z.number(),
        unit: z.string().default('piece'),
        estimatedUnitCost: z.number().optional(),
        totalEstimatedCost: z.number().optional(),
        manufacturer: z.string().optional(),
        modelNumber: z.string().optional(),
        specificationNotes: z.string().optional(),
        installationNotes: z.string().optional(),
        requiredDate: z.date().optional(),
        status: z.enum(['pending', 'ordered', 'delivered', 'installed', 'cancelled']).default('pending'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      }))
      .mutation(async ({ input, ctx }) => {
        // Convert numeric fields to strings for database storage
        const dbInput: any = { ...input, createdById: ctx.user.id };
        if (dbInput.estimatedUnitCost !== undefined) {
          dbInput.estimatedUnitCost = dbInput.estimatedUnitCost?.toString();
        }
        if (dbInput.totalEstimatedCost !== undefined) {
          dbInput.totalEstimatedCost = dbInput.totalEstimatedCost?.toString();
        }
        const id = await db.createFFEItem(dbInput);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        type: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        estimatedUnitCost: z.number().optional(),
        totalEstimatedCost: z.number().optional(),
        manufacturer: z.string().optional(),
        modelNumber: z.string().optional(),
        specificationNotes: z.string().optional(),
        installationNotes: z.string().optional(),
        requiredDate: z.date().optional(),
        status: z.enum(['pending', 'ordered', 'delivered', 'installed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        linkedProcurementItemId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        // Convert numeric fields to strings for database storage
        const dbUpdates: any = { ...updates };
        if (dbUpdates.estimatedUnitCost !== undefined) {
          dbUpdates.estimatedUnitCost = dbUpdates.estimatedUnitCost?.toString();
        }
        if (dbUpdates.totalEstimatedCost !== undefined) {
          dbUpdates.totalEstimatedCost = dbUpdates.totalEstimatedCost?.toString();
        }
        await db.updateFFEItem(id, dbUpdates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFFEItem(input.id);
        return { success: true };
      }),
   }),

  fileAnalysis: router({
    analyzeProjectFiles: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .query(async ({ input }) => {
        const documents = await db.getDocumentsByProject(input.projectId);
        
        const analysis = {
          hasBOQ: false,
          hasDrawings: false,
          boqFiles: [] as any[],
          drawingFiles: [] as any[],
          missingDocuments: [] as string[],
        };
        
        const boqFiles = documents?.filter(doc => 
          doc.name.toLowerCase().includes('boq') || 
          doc.name.toLowerCase().includes('bill of quantities') ||
          doc.category === 'report'
        ) || [];
        
        const drawingFiles = documents?.filter(doc => 
          doc.name.toLowerCase().includes('drawing') || 
          doc.name.toLowerCase().includes('plan') ||
          doc.category === 'drawing'
        ) || [];
        
        analysis.hasBOQ = boqFiles.length > 0;
        analysis.hasDrawings = drawingFiles.length > 0;
        analysis.boqFiles = boqFiles.map(f => ({ id: f.id, name: f.name, url: f.fileUrl }));
        analysis.drawingFiles = drawingFiles.map(f => ({ id: f.id, name: f.name, url: f.fileUrl }));
        
        if (!analysis.hasBOQ) analysis.missingDocuments.push('Bill of Quantities (BOQ)');
        if (!analysis.hasDrawings) analysis.missingDocuments.push('Drawings/Plans');
        
        return analysis;
      }),
  }),

  documentGeneration: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        documentType: z.enum(['boq', 'drawings', 'baseline', 'procurement_log', 'engineering_log', 'budget_estimation', 'value_engineering', 'other']),
        title: z.string(),
        description: z.string().optional(),
        sourceDocumentIds: z.string().optional(),
        missingInformation: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDocumentGeneration({
          projectId: input.projectId,
          documentType: input.documentType,
          title: input.title,
          description: input.description,
          sourceDocumentIds: input.sourceDocumentIds,
          status: 'pending',
          createdById: ctx.user.id,
          missingInformation: input.missingInformation,
        });
        return { id };
      }),
    
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentGenerationsByProject(input.projectId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentGenerationById(input.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocumentGeneration(input.id);
        return { success: true };
      }),
    
    generateAndSave: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        documentType: z.string(),
        boqContent: z.string().optional(),
        drawingsDescription: z.string().optional(),
        missingInfo: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        
        const marketData = await db.getAllMarketData();
        const marketSummary = marketData.slice(0, 20).map(m => `${m.itemName}: ${m.averagePrice} ${m.unit}`).join(', ');
        
        const documentTypeNames: Record<string, string> = {
          'baseline': 'Initial Baseline Program',
          'procurement': 'Initial Procurement Log',
          'engineering': 'Engineering Log',
          'budget': 'Budget Estimation',
          'value_engineering': 'Value Engineering Recommendations',
          'risk_assessment': 'Risk Assessment',
        };
        
        const prompt = `You are a professional fit-out project consultant in Dubai. Generate a detailed ${documentTypeNames[input.documentType] || input.documentType} for the following project.

Project: ${project.name}
Location: ${project.location}
Budget: ${project.budget}
Description: ${project.description}

BOQ Content: ${input.boqContent || 'Not provided'}
Drawings Description: ${input.drawingsDescription || 'Not provided'}
Additional Information: ${JSON.stringify(input.missingInfo || {})}

Dubai Market Data Sample: ${marketSummary}

Generate a comprehensive and detailed ${documentTypeNames[input.documentType] || input.documentType} with specific recommendations, timelines, costs, and action items based on Dubai market conditions and best practices. Format the output as a professional document with clear sections and bullet points.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert fit-out project manager in Dubai with deep knowledge of local market, regulations, and best practices.' },
            { role: 'user', content: prompt }
          ],
        });
        
        const content = response.choices[0]?.message?.content;
        const generatedContent = typeof content === 'string' ? content : '';
        
        const docId = await db.createDocumentGeneration({
          projectId: input.projectId,
          documentType: input.documentType as any,
          title: `${documentTypeNames[input.documentType] || input.documentType} - ${new Date().toLocaleDateString()}`,
          description: `AI-generated ${documentTypeNames[input.documentType] || input.documentType} based on project files and Dubai market analysis`,
          generatedContent: generatedContent,
          status: 'completed',
          createdById: ctx.user.id,
          marketDataUsed: JSON.stringify({ count: marketData.length, sample: marketSummary }),
          generationPrompt: prompt,
        });
        
        return { id: docId, content: generatedContent };
      }),

    generateComprehensive: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        boqContent: z.string().optional(),
        drawingsDescription: z.string().optional(),
        missingInfo: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
        
        const marketData = await db.getAllMarketData();
        const marketSummary = marketData.slice(0, 20).map(m => `${m.itemName}: ${m.averagePrice} ${m.unit}`).join(', ');
        
        const prompt = `You are a professional fit-out project consultant in Dubai. Based on the following project information and Dubai market data, generate comprehensive project documentation.

Project: ${project.name}
Location: ${project.location}
Budget: ${project.budget}
Description: ${project.description}

BOQ Content: ${input.boqContent || 'Not provided'}
Drawings Description: ${input.drawingsDescription || 'Not provided'}
Missing Information: ${JSON.stringify(input.missingInfo || {})}

Dubai Market Data Sample: ${marketSummary}

Generate a comprehensive project plan including:
1. Initial Baseline Program (schedule)
2. Initial Procurement Log (materials and vendors)
3. Engineering Log (technical specifications)
4. Budget Estimation (detailed breakdown)
5. Value Engineering (cost optimization recommendations)
6. Risk Assessment

Provide detailed, actionable recommendations based on Dubai market conditions and best practices.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert fit-out project manager in Dubai with deep knowledge of local market, regulations, and best practices.' },
            { role: 'user', content: prompt }
          ],
        });
        
        const content = response.choices[0]?.message?.content;
        const generatedContent = typeof content === 'string' ? content : '';
        
        const docId = await db.createDocumentGeneration({
          projectId: input.projectId,
          documentType: 'other',
          title: `Comprehensive Project Documentation - ${new Date().toLocaleDateString()}`,
          description: 'AI-generated comprehensive project documentation based on BOQ and market analysis',
          generatedContent: generatedContent,
          status: 'completed',
          createdById: ctx.user.id,
          marketDataUsed: JSON.stringify({ count: marketData.length, sample: marketSummary }),
          generationPrompt: prompt,
        });
        
        return { id: docId, content: generatedContent };
      }),
  }),

  marketData: router({
    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return db.getMarketDataByCategory(input.category);
      }),
    
    getAll: protectedProcedure
      .query(async () => {
        return db.getAllMarketData();
      }),
    
    search: protectedProcedure
      .input(z.object({ itemName: z.string() }))
      .query(async ({ input }) => {
        return db.getMarketDataByItem(input.itemName);
      }),
  }),

  documentExport: router({
    export: protectedProcedure
      .input(z.object({
        generationId: z.number(),
        projectId: z.number(),
        format: z.enum(['pdf', 'docx']),
        content: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const fileKey = `exports/${input.projectId}/${input.generationId}/${input.format}/${nanoid()}`;
        await db.createDocumentExport({
          generationId: input.generationId,
          projectId: input.projectId,
          exportFormat: input.format,
          fileKey,
          fileName: input.fileName,
          exportedBy: ctx.user.id,
        });
        return { success: true, fileKey };
      }),

    getByGeneration: protectedProcedure
      .input(z.object({ generationId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentExportsByGeneration(input.generationId);
      }),
  }),

  emailSchedule: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        recipientEmails: z.array(z.string().email()),
        frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
        dayOfWeek: z.number().optional(),
        timeOfDay: z.string().optional(),
        reportType: z.string().default('comprehensive'),
        includeAttachments: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createEmailSchedule({
          projectId: input.projectId,
          recipientEmails: JSON.stringify(input.recipientEmails),
          frequency: input.frequency,
          dayOfWeek: input.dayOfWeek,
          timeOfDay: input.timeOfDay,
          reportType: input.reportType,
          includeAttachments: input.includeAttachments,
          createdById: ctx.user.id,
        });
      }),

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getEmailSchedulesByProject(input.projectId);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        recipientEmails: z.array(z.string().email()).optional(),
        frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = {};
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.recipientEmails) updateData.recipientEmails = JSON.stringify(input.recipientEmails);
        if (input.frequency) updateData.frequency = input.frequency;
        await db.updateEmailSchedule(input.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmailSchedule(input.id);
        return { success: true };
      }),
  }),

  documentCollaboration: router({
    addComment: protectedProcedure
      .input(z.object({
        generationId: z.number(),
        projectId: z.number(),
        content: z.string(),
        sectionReference: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createDocumentComment({
          generationId: input.generationId,
          projectId: input.projectId,
          userId: ctx.user.id,
          content: input.content,
          sectionReference: input.sectionReference,
        });
      }),

    getComments: protectedProcedure
      .input(z.object({ generationId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentCommentsByGeneration(input.generationId);
      }),

    resolveComment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateDocumentComment(input.id, { isResolved: true });
        return { success: true };
      }),

    getVersionHistory: protectedProcedure
      .input(z.object({ generationId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentVersionsByGeneration(input.generationId);
      }),

    createVersion: protectedProcedure
      .input(z.object({
        generationId: z.number(),
        projectId: z.number(),
        content: z.string(),
        changesSummary: z.string().optional(),
        changeType: z.enum(['initial', 'updated', 'approved', 'exported']),
      }))
      .mutation(async ({ input, ctx }) => {
        const latestVersion = await db.getLatestDocumentVersion(input.generationId);
        const versionNumber = (latestVersion?.versionNumber || 0) + 1;
        return db.createDocumentVersion({
          generationId: input.generationId,
          projectId: input.projectId,
          versionNumber,
          content: input.content,
          changesSummary: input.changesSummary,
          changedBy: ctx.user.id,
          changeType: input.changeType,
        });
      }),
  }),

  sprints: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        targetPoints: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.getDb().then(db => db?.insert(sprints).values({
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          targetPoints: input.targetPoints,
          createdById: ctx.user.id,
          status: 'planning' as const,
        }));
        return result ? { success: true } : null;
      }),

    listByProject: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!db) return [];
        return database.select().from(sprints).where(eq(sprints.projectId, input));
      }),

    getActive: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!db) return [];
        return database.select().from(sprints).where(and(eq(sprints.projectId, input), eq(sprints.status, 'active')));
      }),

    recordVelocity: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        completedPoints: z.number(),
        plannedPoints: z.number(),
        completedTasks: z.number(),
        totalTasks: z.number(),
        teamMembersActive: z.number(),
      }))
      .mutation(async ({ input }) => {
        const score = input.completedPoints / Math.max(input.plannedPoints, 1);
        const database = await db.getDb();
        if (!db) return null;
        return database.insert(teamVelocity).values({
          projectId: input.projectId,
          completedPoints: input.completedPoints,
          plannedPoints: input.plannedPoints,
          completedTasks: input.completedTasks,
          totalTasks: input.totalTasks,
          teamMembersActive: input.teamMembersActive,
          velocityScore: score,
        });
      }),

    getVelocityHistory: publicProcedure
      .input(z.object({
        projectId: z.number(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!db) return [];
        return database.select().from(teamVelocity)
          .where(eq(teamVelocity.projectId, input.projectId))
          .orderBy(desc(teamVelocity.recordedAt))
          .limit(input.limit);
      }),

    getStorage: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!db) return null;
        const result = await database.select().from(workspaceStorage)
          .where(eq(workspaceStorage.projectId, input))
          .orderBy(desc(workspaceStorage.lastCalculatedAt))
          .limit(1);
        return result[0] || null;
      }),
  }),
});
export type AppRouter = typeof appRouter;
