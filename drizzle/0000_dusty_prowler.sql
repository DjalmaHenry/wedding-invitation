CREATE TABLE `guests` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT "guests_category_check" CHECK("guests"."category" IN ('noivo', 'noiva'))
);
--> statement-breakpoint
CREATE INDEX `guests_submission_id_idx` ON `guests` (`submission_id`);--> statement-breakpoint
CREATE INDEX `guests_category_idx` ON `guests` (`category`);--> statement-breakpoint
CREATE INDEX `guests_created_at_idx` ON `guests` (`created_at`);