CREATE TABLE `bulk_import_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bulkImportId` int NOT NULL,
	`rowIndex` int NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`projectDescription` text NOT NULL,
	`projectType` varchar(100),
	`budget` varchar(50),
	`timeline` varchar(100),
	`location` varchar(255),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bulk_import_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulk_import_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bulkImportItemId` int NOT NULL,
	`templateId` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`confidenceScore` int NOT NULL,
	`matchingReasons` json NOT NULL,
	`previewImage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulk_import_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulk_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`totalItems` int NOT NULL,
	`processedItems` int NOT NULL DEFAULT 0,
	`successfulItems` int NOT NULL DEFAULT 0,
	`failedItems` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bulk_imports_id` PRIMARY KEY(`id`)
);
