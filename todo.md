# Fit-Out Project Management Dashboard - TODO

## Core Infrastructure
- [x] Database schema design and implementation
- [x] User authentication with role-based access control (admin/user)
- [x] tRPC routers for all features

## Project Management
- [x] Project creation form (name, client, location, budget, timeline, status)
- [x] Project list view with filtering and search
- [x] Project detail page with overview
- [x] Project editing and deletion
- [x] Project status tracking (planning, in-progress, on-hold, completed)

## Task Management
- [x] Task creation with assignments, priorities, deadlines
- [x] Task list view with filtering by status/priority/assignee
- [x] Task progress tracking and status updates
- [ ] Task dependencies and subtasks
- [ ] Task comments and activity log

## Document Management
- [x] Document upload to S3 storage
- [x] Document categorization (drawings, contracts, invoices, reports)
- [x] Document list and preview
- [ ] Document version history

## Budget & Financial Tracking
- [x] Budget setup per project
- [x] Cost category breakdown (labor, materials, equipment, etc.)
- [x] Expense tracking and entry
- [x] Budget vs actual comparison
- [x] Financial summary dashboard

## Timeline & Scheduling
- [x] Gantt-style timeline visualization
- [x] Milestone tracking
- [x] Phase/stage management
- [ ] Schedule conflict detection

## Team Management
- [x] Team member list per project
- [x] Role assignments (project manager, engineer, contractor, etc.)
- [x] Team member invitation
- [ ] Workload overview

## AI Assistant
- [x] AI-powered project updates generation
- [x] Project summary and insights
- [x] Recommendations for schedule/budget optimization
- [x] Chat interface for project queries

## Dashboard & Analytics
- [x] Main dashboard with project overview
- [x] Key statistics (active projects, tasks, budget utilization)
- [x] Recent activities feed
- [x] Charts and visualizations

## Notifications
- [x] Real-time notifications for task assignments
- [x] Project update notifications
- [ ] Deadline reminders
- [x] Notification preferences

## UI/UX
- [x] Professional dashboard layout with sidebar
- [x] Responsive design for tablet/desktop
- [x] Clean, construction-industry appropriate styling
- [x] Loading states and error handling

## Testing
- [x] Unit tests for projects router
- [x] Unit tests for tasks router
- [x] Unit tests for auth logout


## Weekly Report Generation Enhancement
- [x] Add generateWeeklyReport mutation to AI router
- [x] Create comprehensive report format (status, tasks, budget, milestones, recommendations)
- [x] Update AI Assistant UI with "Generate Weekly Report" button
- [x] Add report preview/download functionality
- [x] Unit tests for AI router including weekly report generation

## Resource Allocation Enhancement
- [x] Add resource allocation data collection to weekly report mutation
- [x] Include team member workload and task distribution metrics
- [x] Update LLM prompt with resource utilization section
- [x] Update report dialog UI to display resource metrics
- [x] Update unit tests for resource allocation

## AI Procurement Log Feature
- [x] Create procurement database schema (vendors, procurement items, orders, deliveries)
- [x] Create tRPC routers for procurement CRUD operations
- [x] Build Procurement Log UI page with list view and forms
- [x] Implement AI tool to auto-generate procurement lists from project requirements
- [x] Implement AI tool to suggest vendors based on item categories
- [x] Add order tracking and delivery status management
- [x] Add procurement reports and cost analysis
- [x] Add navigation link in sidebar
- [x] Write unit tests for procurement features

## Baseline Program Feature
- [x] Create baseline database schema (baseline snapshots, schedule comparisons)
- [x] Create tRPC routers for baseline CRUD operations
- [x] Build Baseline Program UI page with schedule visualization
- [x] Implement baseline vs actual comparison charts
- [x] Add variance analysis and delay tracking
- [x] Implement AI tool for schedule optimization recommendations
- [x] Add navigation link in sidebar
- [x] Write unit tests for baseline features
