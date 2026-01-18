CREATE TABLE `project_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`tags` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`previewImage` varchar(500),
	`defaultSettings` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_boq_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`category` varchar(100) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitOfMeasure` varchar(50) NOT NULL,
	`unitPrice` decimal(12,2),
	`vendorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_boq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`vendorId` int NOT NULL,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_suppliers_id` PRIMARY KEY(`id`)
);
