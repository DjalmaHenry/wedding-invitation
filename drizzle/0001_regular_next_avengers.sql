CREATE TABLE `gift_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`mercado_pago_payment_id` text NOT NULL,
	`external_reference` text NOT NULL,
	`gift_id` text NOT NULL,
	`gift_title` text NOT NULL,
	`donor_name` text NOT NULL,
	`donor_email` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text NOT NULL,
	`status_detail` text,
	`ticket_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`paid_at` text,
	CONSTRAINT "gift_payments_amount_check" CHECK("gift_payments"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_payments_mercado_pago_payment_id_unique` ON `gift_payments` (`mercado_pago_payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gift_payments_external_reference_unique` ON `gift_payments` (`external_reference`);--> statement-breakpoint
CREATE INDEX `gift_payments_status_idx` ON `gift_payments` (`status`);--> statement-breakpoint
CREATE INDEX `gift_payments_created_at_idx` ON `gift_payments` (`created_at`);--> statement-breakpoint
CREATE INDEX `gift_payments_donor_name_idx` ON `gift_payments` (`donor_name`);