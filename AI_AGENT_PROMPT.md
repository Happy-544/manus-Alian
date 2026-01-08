# Fit-Out Project Management Dashboard - Comprehensive Development Prompt

## Project Overview

Build a comprehensive **Fit-Out Project Management Dashboard** application for managing construction/interior design projects in Dubai. The application should enable project managers, contractors, and stakeholders to manage projects, tasks, budgets, procurement, materials, and generate AI-powered project documentation.

**Target Users**: Construction project managers, fit-out contractors, interior designers, procurement specialists, and project stakeholders in the UAE/Dubai market.

**Primary Goal**: Provide an integrated platform for end-to-end project management with AI-powered document generation, market data integration, and collaborative features.

---

## Core Features & Modules

### 1. Project Management
- **Create/Edit Projects**: Store project details (name, description, client info, location, budget, timeline)
- **Project Dashboard**: Overview with key metrics (total projects, active tasks, budget status, completion percentage)
- **Project Status Tracking**: Track project lifecycle (planning, in_progress, on_hold, completed, cancelled)
- **Project Members**: Add team members with role-based access control (admin, user)
- **Project Activity Log**: Track all changes and activities within a project

### 2. Task Management
- **Task Creation & Assignment**: Create tasks with descriptions, due dates, priorities, and assignees
- **Task Hierarchy**: Support parent-child task relationships for complex workflows
- **Task Status Workflow**: Draft → In Progress → In Review → Completed
- **Task Comments**: Add comments and notes to tasks for collaboration
- **Task Timeline**: Gantt-like view of task schedules
- **Task Filtering & Search**: Filter by status, priority, assignee, due date

### 3. Budget Management
- **Budget Categories**: Define budget categories (materials, labor, equipment, contingency, etc.)
- **Expense Tracking**: Log expenses against budget categories
- **Budget vs Actual**: Compare budgeted amounts with actual spending
- **Budget Alerts**: Notify when spending exceeds thresholds
- **Financial Reports**: Generate budget utilization reports

### 4. Procurement Management
- **Vendor Management**: Store vendor information (name, contact, specialization, ratings)
- **Procurement Items**: Create procurement requests with specifications
- **Purchase Orders**: Generate and track purchase orders
- **Delivery Tracking**: Monitor delivery status and receipt of materials
- **Vendor Performance**: Track vendor ratings and performance metrics

### 5. Materials & FF&E Management
- **Material Inventory**: Track materials (quantity, unit, cost, supplier)
- **FF&E (Furniture, Fixtures & Equipment)**: Manage FF&E items with specifications
- **Material Categories**: Organize materials by type (flooring, paint, fixtures, etc.)
- **Material Specifications**: Store technical specifications and standards
- **Cost Tracking**: Monitor material costs and market prices

### 6. Baseline & Schedule Management
- **Project Baseline**: Define initial project schedule and plan
- **Baseline Tasks**: Break down project into phases and milestones
- **Schedule Variance**: Track actual vs planned schedule
- **Progress Snapshots**: Capture project progress at key points
- **Milestone Tracking**: Monitor critical project milestones

### 7. Document Management & AI Generation
- **Document Upload**: Upload BOQ (Excel/PDF), Drawings (PDF/CAD), contracts, permits, specifications
- **File Type Detection**: Automatically detect and categorize uploaded files
- **AI File Analysis**: Read and analyze BOQ and Drawing files using LLM
- **AI Document Generation**: Generate 6 types of documents:
  - Initial Baseline Program (schedule and timeline)
  - Initial Procurement Log (materials and vendors)
  - Engineering Log (technical specifications)
  - Budget Estimation (detailed cost breakdown)
  - Value Engineering (cost optimization recommendations)
  - Risk Assessment (project risks and mitigation)
- **Conditional Information Gathering**: Ask for missing information if BOQ/Drawings not available
- **Document Export**: Export generated documents as PDF or Word (.docx)
- **Document Versioning**: Track document versions and changes
- **Document Comments**: Add collaborative comments to documents

### 8. Dubai Market Data Integration
- **Market Pricing**: Store Dubai market prices for common materials and services
- **Price Categories**: Organize by material type, supplier, and date
- **Market Intelligence**: Use market data in AI-generated documents for cost estimation
- **Price Trends**: Track price changes over time

### 9. Email Scheduling & Notifications
- **Email Schedules**: Configure automated email delivery of project reports
- **Frequency Options**: Daily, weekly, biweekly, monthly delivery
- **Report Templates**: Customize what information is included in emails
- **Recipient Management**: Manage email recipient lists
- **Notification System**: Real-time notifications for project updates

### 10. AI Chat Assistant
- **Project Chat**: Ask questions about project status, tasks, budget, etc.
- **Natural Language Processing**: Understand project-related queries
- **Context Awareness**: Provide answers based on project data
- **Document Analysis**: Analyze and summarize project documents

---

## Database Schema Design

### Core Tables

```
users
├── id (PK)
├── openId (unique)
├── name
├── email
├── avatar
├── phone
├── jobTitle
├── role (enum: admin, user)
├── lastSignedIn
└── timestamps

projects
├── id (PK)
├── name
├── description
├── clientName
├── clientEmail
├── clientPhone
├── location
├── address
├── status (enum: planning, in_progress, on_hold, completed, cancelled)
├── priority (enum: low, medium, high, critical)
├── budget
├── spentAmount
├── currency
├── startDate
├── endDate
├── actualEndDate
├── progress (percentage)
├── coverImage
├── createdById (FK)
└── timestamps

projectMembers
├── id (PK)
├── projectId (FK)
├── userId (FK)
├── role (enum: admin, manager, member)
└── timestamps

tasks
├── id (PK)
├── projectId (FK)
├── title
├── description
├── status (enum: draft, in_progress, in_review, completed)
├── priority (enum: low, medium, high, critical)
├── assignedTo (FK to users)
├── dueDate
├── startDate
├── completedDate
├── parentTaskId (FK - for subtasks)
├── progress (percentage)
├── createdById (FK)
└── timestamps

taskComments
├── id (PK)
├── taskId (FK)
├── userId (FK)
├── content
└── timestamps

documents
├── id (PK)
├── projectId (FK)
├── name
├── description
├── category (enum: drawing, contract, invoice, report, permit, photo, specification, other)
├── fileUrl
├── fileKey
├── fileSize
├── mimeType
├── version
├── uploadedBy (FK)
└── timestamps

documentGenerations
├── id (PK)
├── projectId (FK)
├── documentType (enum: baseline, procurement_log, engineering_log, budget_estimation, value_engineering, other)
├── title
├── description
├── sourceDocumentIds
├── generatedContent (text)
├── status (enum: pending, generating, completed)
├── errorMessage
├── marketDataUsed (JSON)
├── generationPrompt (text)
├── missingInformation
├── generatedAt
├── createdById (FK)
└── timestamps

documentExports
├── id (PK)
├── generationId (FK)
├── projectId (FK)
├── exportFormat (enum: pdf, docx)
├── fileKey
├── fileName
├── exportedBy (FK)
└── timestamps

documentComments
├── id (PK)
├── generationId (FK)
├── userId (FK)
├── content
├── sectionReference
└── timestamps

documentVersions
├── id (PK)
├── generationId (FK)
├── versionNumber
├── changeType (enum: created, updated, exported, commented)
├── changeSummary
├── changedBy (FK)
└── timestamps

emailSchedules
├── id (PK)
├── projectId (FK)
├── recipientEmails (array)
├── frequency (enum: daily, weekly, biweekly, monthly)
├── dayOfWeek (0-6 for weekly)
├── dayOfMonth (1-31 for monthly)
├── reportType (enum: summary, detailed, budget, schedule)
├── isActive
├── lastSentAt
├── createdBy (FK)
└── timestamps

budgetCategories
├── id (PK)
├── projectId (FK)
├── name
├── allocatedAmount
├── description
└── timestamps

expenses
├── id (PK)
├── projectId (FK)
├── categoryId (FK)
├── amount
├── description
├── date
├── vendor
├── receipt
├── approvedBy (FK)
└── timestamps

vendors
├── id (PK)
├── name
├── email
├── phone
├── specialization
├── location
├── rating (1-5)
├── totalProjects
└── timestamps

procurementItems
├── id (PK)
├── projectId (FK)
├── name
├── description
├── quantity
├── unit
├── estimatedCost
├── vendor (FK)
├── status (enum: pending, ordered, delivered, received)
└── timestamps

purchaseOrders
├── id (PK)
├── projectId (FK)
├── poNumber
├── vendorId (FK)
├── totalAmount
├── status (enum: draft, sent, confirmed, completed)
├── issueDate
├── dueDate
└── timestamps

purchaseOrderItems
├── id (PK)
├── purchaseOrderId (FK)
├── procurementItemId (FK)
├── quantity
├── unitPrice
├── total
└── timestamps

deliveries
├── id (PK)
├── purchaseOrderId (FK)
├── deliveryDate
├── receivedQuantity
├── status (enum: pending, in_transit, delivered, received)
├── notes
└── timestamps

materialList
├── id (PK)
├── projectId (FK)
├── name
├── category
├── quantity
├── unit
├── unitCost
├── supplier
├── specifications
└── timestamps

ffeList
├── id (PK)
├── projectId (FK)
├── name
├── category
├── description
├── quantity
├── unitCost
├── supplier
├── specifications
└── timestamps

projectBaselines
├── id (PK)
├── projectId (FK)
├── name
├── description
├── baselineDate
└── timestamps

baselineTasks
├── id (PK)
├── baselineId (FK)
├── taskId (FK)
├── plannedStartDate
├── plannedEndDate
└── timestamps

scheduleVariances
├── id (PK)
├── projectId (FK)
├── taskId (FK)
├── plannedDate
├── actualDate
├── variance (days)
└── timestamps

progressSnapshots
├── id (PK)
├── projectId (FK)
├── snapshotDate
├── overallProgress (percentage)
├── tasksCompleted
├── budgetUtilization (percentage)
├── notes
└── timestamps

dubaiMarketData
├── id (PK)
├── itemName
├── category
├── averagePrice
├── unit
├── supplier
├── lastUpdated
└── timestamps

aiChats
├── id (PK)
├── projectId (FK)
├── userId (FK)
├── userMessage
├── aiResponse
├── context (JSON)
└── timestamps

notifications
├── id (PK)
├── userId (FK)
├── title
├── content
├── type (enum: task_assigned, budget_alert, document_ready, deadline_approaching)
├── relatedId (FK to related entity)
├── isRead
└── timestamps

activityLogs
├── id (PK)
├── projectId (FK)
├── userId (FK)
├── action (enum: created, updated, deleted, commented, exported)
├── entityType (enum: project, task, document, expense, etc.)
├── entityId
├── changes (JSON)
└── timestamps
```

---

## API Design (RESTful/GraphQL)

### Authentication
- OAuth 2.0 integration with Manus platform
- JWT-based session management
- Role-based access control (RBAC)

### API Endpoints/Procedures

#### Projects
- `GET /projects` - List all projects
- `GET /projects/:id` - Get project details
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/stats` - Get project statistics

#### Tasks
- `GET /projects/:id/tasks` - List tasks for project
- `POST /projects/:id/tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/comments` - Add comment to task

#### Documents
- `GET /projects/:id/documents` - List documents
- `POST /projects/:id/documents/upload` - Upload document
- `DELETE /documents/:id` - Delete document
- `GET /documents/:id/download` - Download document

#### AI Document Generation
- `POST /documentGeneration/generateAndSave` - Generate specific document type
- `GET /documentGeneration/:id` - Get generated document
- `POST /documentGeneration/:id/export` - Export document (PDF/Word)
- `GET /fileAnalysis/analyzeProjectFiles` - Analyze project files for BOQ/Drawings

#### Budget
- `GET /projects/:id/budget` - Get budget overview
- `POST /projects/:id/expenses` - Log expense
- `GET /projects/:id/expenses` - List expenses

#### Procurement
- `GET /projects/:id/procurement` - List procurement items
- `POST /projects/:id/procurement` - Create procurement item
- `GET /vendors` - List vendors
- `POST /purchaseOrders` - Create purchase order

#### Market Data
- `GET /marketData/all` - Get all market data
- `GET /marketData/search` - Search market data by item
- `GET /marketData/category/:category` - Get data by category

#### Email Scheduling
- `POST /emailSchedule/create` - Create email schedule
- `GET /emailSchedule/:id` - Get schedule details
- `PUT /emailSchedule/:id` - Update schedule
- `DELETE /emailSchedule/:id` - Delete schedule

#### AI Chat
- `POST /ai/chat` - Send message to AI assistant
- `GET /ai/chat/:projectId` - Get chat history

---

## Technology Stack Recommendations

### Frontend
- **Framework**: React 19+ or Vue 3+ or Svelte
- **Styling**: Tailwind CSS 4+
- **UI Components**: shadcn/ui or similar component library
- **State Management**: TanStack Query, Zustand, or similar
- **Forms**: React Hook Form or similar
- **Export**: html2pdf.js, docx library for client-side exports

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js, Fastify, or similar
- **API Layer**: tRPC, GraphQL, or REST
- **Database**: MySQL, PostgreSQL, or TiDB
- **ORM**: Drizzle ORM, Prisma, or TypeORM
- **Authentication**: OAuth 2.0, JWT
- **File Storage**: S3 or similar cloud storage
- **LLM Integration**: OpenAI API or similar for AI document generation
- **Email**: Nodemailer or SendGrid for email scheduling

### DevOps & Infrastructure
- **Deployment**: Docker, Kubernetes, or Platform-as-a-Service
- **CI/CD**: GitHub Actions, GitLab CI, or similar
- **Monitoring**: Application performance monitoring tools
- **Testing**: Vitest, Jest for unit tests; Cypress/Playwright for E2E tests

---

## Key Implementation Requirements

### 1. File Upload & Analysis
- Support BOQ files in Excel (.xlsx, .xls) and PDF formats
- Support Drawing files in PDF and CAD formats (.dwg, .dxf, .rvt)
- Implement file type detection based on filename and extension
- Use PDF parsing library to extract text from PDFs
- Use Excel parsing library to read BOQ data
- Parse BOQ items (description, quantity, unit, rate, total)
- Extract drawing metadata (title, scale, dimensions, areas)

### 2. AI Document Generation
- Integrate with LLM API (OpenAI, Claude, etc.)
- Create system prompts for each document type
- Include Dubai market data in prompts for pricing intelligence
- Support conditional information gathering (ask for missing info if files incomplete)
- Generate structured, professional documents
- Auto-save generated documents to project documents
- Track generation history and prompts for audit trail

### 3. Market Data Integration
- Populate Dubai market data for common materials and services
- Include pricing, suppliers, and categories
- Use market data in AI prompts for realistic cost estimation
- Allow market data updates and management

### 4. Email Scheduling
- Implement scheduled email delivery using cron jobs or task queue
- Support multiple frequencies (daily, weekly, biweekly, monthly)
- Generate report content dynamically
- Track email delivery status

### 5. Real-time Collaboration
- Support concurrent document editing/commenting
- Track changes and versions
- Implement activity logging for audit trail
- Send notifications for project updates

### 6. Export Functionality
- Generate PDF exports with proper formatting
- Generate Word (.docx) documents with structure
- Support batch exports
- Include project metadata in exports

### 7. Dashboard & Analytics
- Display key project metrics (budget, schedule, progress)
- Show recent activities and updates
- Provide filtering and search capabilities
- Generate project reports

### 8. Role-Based Access Control
- Define roles: Admin, Project Manager, Team Member, Viewer
- Implement permission checks on all operations
- Restrict sensitive operations (delete, export, etc.)
- Audit all access and changes

### 9. Error Handling & Validation
- Validate all inputs (file types, sizes, formats)
- Implement comprehensive error messages
- Log errors for debugging
- Graceful error recovery

### 10. Performance & Scalability
- Optimize database queries with proper indexing
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Optimize file uploads and exports
- Support concurrent users

---

## Testing Requirements

### Unit Tests
- Test file reading utilities (BOQ, Drawing parsing)
- Test document generation logic
- Test market data integration
- Test email scheduling logic
- Test RBAC and permissions

### Integration Tests
- Test API endpoints
- Test database operations
- Test file upload and download
- Test email delivery
- Test LLM integration

### E2E Tests
- Test complete workflows (project creation to document generation)
- Test user interactions
- Test file uploads and exports
- Test multi-user scenarios

### Test Coverage
- Aim for 80%+ code coverage
- Test happy paths and error scenarios
- Test edge cases and boundary conditions

---

## Security Requirements

1. **Authentication**: Secure OAuth 2.0 implementation
2. **Authorization**: Role-based access control
3. **Data Protection**: Encrypt sensitive data at rest and in transit
4. **File Security**: Validate file types and scan for malware
5. **API Security**: Implement rate limiting, CORS, CSRF protection
6. **Audit Logging**: Log all sensitive operations
7. **Input Validation**: Sanitize all user inputs
8. **Dependency Management**: Keep dependencies updated

---

## Deployment Checklist

- [ ] Environment configuration (dev, staging, production)
- [ ] Database migrations and backups
- [ ] File storage setup (S3 or equivalent)
- [ ] Email service configuration
- [ ] LLM API keys and rate limits
- [ ] OAuth configuration
- [ ] SSL/TLS certificates
- [ ] Monitoring and alerting
- [ ] Logging and error tracking
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation

---

## Success Metrics

1. **Functionality**: All core features implemented and working
2. **Performance**: Page load time < 2s, API response time < 500ms
3. **Reliability**: 99.5% uptime, zero critical bugs
4. **User Experience**: Intuitive UI, smooth interactions
5. **Code Quality**: Clean code, proper documentation, 80%+ test coverage
6. **Security**: No security vulnerabilities, proper access controls
7. **Scalability**: Support 1000+ concurrent users

---

## Development Timeline Estimate

- **Phase 1 (Weeks 1-2)**: Project setup, database schema, authentication
- **Phase 2 (Weeks 3-4)**: Core project and task management
- **Phase 3 (Weeks 5-6)**: Budget and procurement modules
- **Phase 4 (Weeks 7-8)**: Document management and file handling
- **Phase 5 (Weeks 9-10)**: AI document generation and market data
- **Phase 6 (Weeks 11-12)**: Email scheduling, notifications, AI chat
- **Phase 7 (Weeks 13-14)**: Testing, optimization, security audit
- **Phase 8 (Week 15)**: Deployment and launch

---

## Additional Notes

- Focus on user experience and intuitive design
- Prioritize security and data protection
- Implement comprehensive error handling
- Maintain clean, well-documented code
- Use industry best practices
- Consider scalability from the start
- Implement proper monitoring and logging
- Plan for future enhancements and features

---

## References & Resources

- Dubai Construction Market Data (for market pricing)
- BIM Standards and Specifications
- Project Management Best Practices (PMI, PRINCE2)
- Construction Industry Standards
- Cloud Storage and Email Service Documentation
- LLM API Documentation (OpenAI, Claude, etc.)

---

**End of Prompt**

This comprehensive prompt provides another AI agent with all necessary information to build the Fit-Out Project Management Dashboard application from scratch.
