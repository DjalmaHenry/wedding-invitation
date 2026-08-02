ALTER TABLE `invited_guests` ADD `matched_guest_id` text REFERENCES guests(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `invited_guests_matched_guest_id_unique` ON `invited_guests` (`matched_guest_id`);
