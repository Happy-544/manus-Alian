CREATE TABLE `documentComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`sectionReference` varchar(255),
	`isResolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`projectId` int NOT NULL,
	`exportFormat` enum('pdf','docx') NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` text,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`exportedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`projectId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`content` text NOT NULL,
	`changesSummary` text,
	`changedBy` int NOT NULL,
	`changeType` enum('initial','updated','approved','exported') NOT NULL DEFAULT 'initial',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`recipientEmails` text NOT NULL,
	`frequency` enum('daily','weekly','biweekly','monthly') NOT NULL DEFAULT 'weekly',
	`dayOfWeek` int,
	`timeOfDay` varchar(5),
	`reportType` varchar(100) NOT NULL DEFAULT 'comprehensive',
	`includeAttachments` boolean DEFAULT true,
	`isActive` boolean DEFAULT true,
	`lastSentAt` timestamp,
	`nextScheduledAt` timestamp,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailSchedules_id` PRIMARY KEY(`id`)
);
