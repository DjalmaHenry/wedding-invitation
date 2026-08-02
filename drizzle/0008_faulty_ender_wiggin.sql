CREATE TABLE `vendor_options` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`hours` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`benefits` text NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT "vendor_options_hours_check" CHECK("vendor_options"."hours" > 0),
	CONSTRAINT "vendor_options_amount_check" CHECK("vendor_options"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE INDEX `vendor_options_category_idx` ON `vendor_options` (`category`);--> statement-breakpoint
CREATE INDEX `vendor_options_name_idx` ON `vendor_options` (`name`);--> statement-breakpoint
CREATE INDEX `vendor_options_created_at_idx` ON `vendor_options` (`created_at`);--> statement-breakpoint
PRAGMA optimize;
