import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin procedure - only allows admin users
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
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
4. **Issues & Risks** (any concerns or blockers)
5. **Financial Status** (budget health assessment)
6. **Next Week's Priorities** (planned activities)
7. **Recommendations** (actionable suggestions)

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
          }
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
