CREATE TABLE `invited_guests` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`normalized_first_name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invited_guests_normalized_first_name_idx` ON `invited_guests` (`normalized_first_name`);--> statement-breakpoint
CREATE INDEX `invited_guests_created_at_idx` ON `invited_guests` (`created_at`);--> statement-breakpoint
PRAGMA optimize;
