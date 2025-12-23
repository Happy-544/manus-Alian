CREATE TABLE `baseline_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`baselineId` int NOT NULL,
	`taskId` int,
	`taskName` varchar(255) NOT NULL,
	`plannedStartDate` timestamp,
	`plannedEndDate` timestamp,
	`plannedDuration` int,
	`plannedProgress` int DEFAULT 0,
	`dependencies` json,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `baseline_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`projectId` int NOT NULL,
	`deliveryNumber` varchar(50),
	`status` enum('scheduled','in_transit','delivered','partial','rejected') NOT NULL DEFAULT 'scheduled',
	`scheduledDate` timestamp,
	`actualDate` timestamp,
	`receivedById` int,
	`notes` text,
	`attachments` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procurement_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('materials','equipment','labor','services','furniture','fixtures','electrical','plumbing','hvac','other') NOT NULL DEFAULT 'other',
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(50) DEFAULT 'pcs',
	`estimatedUnitCost` decimal(15,2),
	`actualUnitCost` decimal(15,2),
	`totalCost` decimal(15,2),
	`status` enum('pending','quoted','approved','ordered','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`requiredDate` timestamp,
	`vendorId` int,
	`specifications` text,
	`notes` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procurement_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`baselineId` int,
	`snapshotDate` timestamp NOT NULL,
	`plannedProgress` int DEFAULT 0,
	`actualProgress` int DEFAULT 0,
	`schedulePerformanceIndex` decimal(5,2),
	`costPerformanceIndex` decimal(5,2),
	`plannedValue` decimal(15,2),
	`earnedValue` decimal(15,2),
	`actualCost` decimal(15,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_baselines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`version` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`plannedStartDate` timestamp NOT NULL,
	`plannedEndDate` timestamp NOT NULL,
	`plannedBudget` decimal(15,2),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_baselines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`procurementItemId` int,
	`description` varchar(500) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(50) DEFAULT 'pcs',
	`unitPrice` decimal(15,2) NOT NULL,
	`totalPrice` decimal(15,2) NOT NULL,
	`receivedQuantity` decimal(10,2) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`vendorId` int NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`status` enum('draft','pending_approval','approved','sent','acknowledged','shipped','delivered','cancelled') NOT NULL DEFAULT 'draft',
	`totalAmount` decimal(15,2) DEFAULT '0',
	`currency` varchar(3) DEFAULT 'USD',
	`orderDate` timestamp,
	`expectedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`shippingAddress` text,
	`paymentTerms` varchar(100),
	`notes` text,
	`createdById` int NOT NULL,
	`approvedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule_variances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`baselineId` int NOT NULL,
	`taskId` int,
	`varianceType` enum('start_delay','end_delay','duration_change','progress_variance') NOT NULL,
	`plannedValue` varchar(255),
	`actualValue` varchar(255),
	`varianceDays` int,
	`variancePercent` decimal(5,2),
	`impact` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`notes` text,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schedule_variances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`category` enum('materials','equipment','labor','services','furniture','fixtures','electrical','plumbing','hvac','other') NOT NULL DEFAULT 'other',
	`rating` int DEFAULT 0,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
