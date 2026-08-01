CREATE TABLE `service_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `service_providers_created_at_idx` ON `service_providers` (`created_at`);--> statement-breakpoint
CREATE INDEX `service_providers_name_idx` ON `service_providers` (`name`);--> statement-breakpoint
CREATE TABLE `wedding_checklist` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `wedding_checklist_completed_idx` ON `wedding_checklist` (`completed`);--> statement-breakpoint
CREATE INDEX `wedding_checklist_created_at_idx` ON `wedding_checklist` (`created_at`);--> statement-breakpoint
CREATE TABLE `wedding_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`payment_type` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`installments_total` integer DEFAULT 0 NOT NULL,
	`installments_paid` integer DEFAULT 0 NOT NULL,
	`due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "wedding_expenses_amount_check" CHECK("wedding_expenses"."amount_cents" > 0),
	CONSTRAINT "wedding_expenses_payment_type_check" CHECK("wedding_expenses"."payment_type" IN ('pix_paid', 'installments', 'pix_pending')),
	CONSTRAINT "wedding_expenses_installments_check" CHECK("wedding_expenses"."installments_total" >= 0 AND "wedding_expenses"."installments_paid" >= 0 AND "wedding_expenses"."installments_paid" <= "wedding_expenses"."installments_total")
);
--> statement-breakpoint
CREATE INDEX `wedding_expenses_category_idx` ON `wedding_expenses` (`category`);--> statement-breakpoint
CREATE INDEX `wedding_expenses_payment_type_idx` ON `wedding_expenses` (`payment_type`);--> statement-breakpoint
CREATE INDEX `wedding_expenses_created_at_idx` ON `wedding_expenses` (`created_at`);--> statement-breakpoint
CREATE TABLE `wedding_timeline` (
	`id` text PRIMARY KEY NOT NULL,
	`time` text NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `wedding_timeline_time_idx` ON `wedding_timeline` (`time`);--> statement-breakpoint
PRAGMA optimize;
