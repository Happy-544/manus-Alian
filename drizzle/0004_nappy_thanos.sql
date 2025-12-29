CREATE TABLE `documentGenerations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`documentType` enum('boq','drawings','baseline','procurement_log','engineering_log','budget_estimation','value_engineering','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sourceDocumentIds` text,
	`generatedContent` text,
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`marketDataUsed` text,
	`generationPrompt` text,
	`missingInformation` text,
	`generatedAt` timestamp,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentGenerations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dubaiMarketData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`averagePrice` decimal(10,2) NOT NULL,
	`priceRange` varchar(100),
	`supplier` varchar(255),
	`lastUpdated` timestamp DEFAULT (now()),
	`dataSource` varchar(255),
	`marketPeriod` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dubaiMarketData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedArtifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`projectId` int NOT NULL,
	`artifactType` varchar(100) NOT NULL,
	`artifactData` text,
	`linkedEntityId` int,
	`linkedEntityType` varchar(100),
	`status` enum('generated','reviewed','approved','rejected','applied') NOT NULL DEFAULT 'generated',
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generatedArtifacts_id` PRIMARY KEY(`id`)
);
