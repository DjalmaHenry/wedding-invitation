PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_gift_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`mercado_pago_order_id` text NOT NULL,
	`mercado_pago_payment_id` text,
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
	CONSTRAINT "gift_payments_amount_check" CHECK("amount_cents" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_gift_payments`("id", "mercado_pago_order_id", "mercado_pago_payment_id", "external_reference", "gift_id", "gift_title", "donor_name", "donor_email", "amount_cents", "status", "status_detail", "ticket_url", "created_at", "updated_at", "paid_at") SELECT "id", "mercado_pago_payment_id", NULL, "external_reference", "gift_id", "gift_title", "donor_name", "donor_email", "amount_cents", "status", "status_detail", "ticket_url", "created_at", "updated_at", "paid_at" FROM `gift_payments`;--> statement-breakpoint
DROP TABLE `gift_payments`;--> statement-breakpoint
ALTER TABLE `__new_gift_payments` RENAME TO `gift_payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `gift_payments_mercado_pago_order_id_unique` ON `gift_payments` (`mercado_pago_order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `gift_payments_external_reference_unique` ON `gift_payments` (`external_reference`);--> statement-breakpoint
CREATE INDEX `gift_payments_status_idx` ON `gift_payments` (`status`);--> statement-breakpoint
CREATE INDEX `gift_payments_created_at_idx` ON `gift_payments` (`created_at`);--> statement-breakpoint
CREATE INDEX `gift_payments_donor_name_idx` ON `gift_payments` (`donor_name`);
