CREATE TABLE `burndown_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sprintId` int NOT NULL,
	`projectId` int NOT NULL,
	`day` int NOT NULL,
	`remainingPoints` int NOT NULL,
	`completedPoints` int DEFAULT 0,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `burndown_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sprintId` int NOT NULL,
	`taskId` int NOT NULL,
	`storyPoints` int DEFAULT 0,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sprint_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('planning','active','completed','cancelled') NOT NULL DEFAULT 'planning',
	`startDate` timestamp,
	`endDate` timestamp,
	`targetPoints` int DEFAULT 0,
	`completedPoints` int DEFAULT 0,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_velocity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sprintId` int,
	`completedPoints` int DEFAULT 0,
	`plannedPoints` int DEFAULT 0,
	`completedTasks` int DEFAULT 0,
	`totalTasks` int DEFAULT 0,
	`teamMembersActive` int DEFAULT 0,
	`velocityScore` decimal(5,2) DEFAULT '0',
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_velocity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_storage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`totalStorageBytes` bigint DEFAULT 0,
	`usedStorageBytes` bigint DEFAULT 0,
	`fileCount` int DEFAULT 0,
	`lastCalculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_storage_id` PRIMARY KEY(`id`)
);
