ALTER TABLE `boq_line_items` MODIFY COLUMN `drawingReferences` json;--> statement-breakpoint
ALTER TABLE `boq_line_items` MODIFY COLUMN `locations` json;--> statement-breakpoint
ALTER TABLE `boq_line_items` MODIFY COLUMN `conflicts` json;--> statement-breakpoint
ALTER TABLE `boq_line_items` MODIFY COLUMN `gaps` json;--> statement-breakpoint
ALTER TABLE `drawing_analysis` MODIFY COLUMN `spaces` json;--> statement-breakpoint
ALTER TABLE `drawing_analysis` MODIFY COLUMN `measurements` json;--> statement-breakpoint
ALTER TABLE `boq_line_items` DROP COLUMN `notes`;