CREATE TABLE `wedding_finance_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`total_planned_cents` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "wedding_finance_settings_total_check" CHECK("wedding_finance_settings"."total_planned_cents" >= 0)
);
