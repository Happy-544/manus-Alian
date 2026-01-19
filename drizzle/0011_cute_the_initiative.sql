CREATE TABLE `active_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`documentId` int NOT NULL,
	`cursorPosition` int NOT NULL DEFAULT 0,
	`cursorLine` int NOT NULL DEFAULT 0,
	`color` varchar(7) NOT NULL,
	`lastActivity` timestamp NOT NULL DEFAULT (now()),
	`isTyping` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `active_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collaboration_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `collaboration_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `collaboration_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `cursor_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`documentId` int NOT NULL,
	`position` int NOT NULL,
	`line` int NOT NULL,
	`column` int NOT NULL,
	`selection` json,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cursor_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`changeType` enum('insert','delete','replace','format') NOT NULL,
	`position` int NOT NULL,
	`content` text,
	`deletedContent` text,
	`version` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_verifications_token_unique` UNIQUE(`token`)
);
