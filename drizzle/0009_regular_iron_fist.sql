PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_wedding_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`payment_type` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`down_payment_cents` integer DEFAULT 0 NOT NULL,
	`installments_total` integer DEFAULT 0 NOT NULL,
	`installments_paid` integer DEFAULT 0 NOT NULL,
	`due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "wedding_expenses_amount_check" CHECK("amount_cents" > 0),
	CONSTRAINT "wedding_expenses_down_payment_check" CHECK("down_payment_cents" >= 0 AND "down_payment_cents" <= "amount_cents"),
	CONSTRAINT "wedding_expenses_payment_type_check" CHECK("payment_type" IN ('pix_paid', 'installments', 'pix_pending')),
	CONSTRAINT "wedding_expenses_installments_check" CHECK("installments_total" >= 0 AND "installments_paid" >= 0 AND "installments_paid" <= "installments_total")
);
--> statement-breakpoint
INSERT INTO `__new_wedding_expenses`("id", "description", "category", "payment_type", "amount_cents", "down_payment_cents", "installments_total", "installments_paid", "due_date", "created_at", "updated_at") SELECT "id", "description", "category", "payment_type", "amount_cents", 0, "installments_total", "installments_paid", "due_date", "created_at", "updated_at" FROM `wedding_expenses`;--> statement-breakpoint
DROP TABLE `wedding_expenses`;--> statement-breakpoint
ALTER TABLE `__new_wedding_expenses` RENAME TO `wedding_expenses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `wedding_expenses_category_idx` ON `wedding_expenses` (`category`);--> statement-breakpoint
CREATE INDEX `wedding_expenses_payment_type_idx` ON `wedding_expenses` (`payment_type`);--> statement-breakpoint
CREATE INDEX `wedding_expenses_created_at_idx` ON `wedding_expenses` (`created_at`);--> statement-breakpoint
PRAGMA optimize;
