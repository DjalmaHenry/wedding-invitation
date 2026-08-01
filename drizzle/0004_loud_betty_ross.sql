CREATE TABLE `expense_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expense_categories_name_unique` ON `expense_categories` (`name`);--> statement-breakpoint
CREATE INDEX `expense_categories_name_idx` ON `expense_categories` (`name`);--> statement-breakpoint
INSERT INTO `expense_categories` (`id`, `name`, `created_at`) VALUES
	('category-local', 'Local', '2026-08-01T00:00:00.000Z'),
	('category-buffet', 'Buffet', '2026-08-01T00:00:00.000Z'),
	('category-decoration', 'Decoração', '2026-08-01T00:00:00.000Z'),
	('category-clothing', 'Vestuário', '2026-08-01T00:00:00.000Z'),
	('category-photo-video', 'Fotografia e vídeo', '2026-08-01T00:00:00.000Z'),
	('category-music', 'Música', '2026-08-01T00:00:00.000Z'),
	('category-ceremonial', 'Cerimonial', '2026-08-01T00:00:00.000Z'),
	('category-stationery', 'Convites e papelaria', '2026-08-01T00:00:00.000Z'),
	('category-honeymoon', 'Lua de mel', '2026-08-01T00:00:00.000Z');
