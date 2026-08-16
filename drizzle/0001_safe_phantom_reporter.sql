CREATE TABLE `admin_magic_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_magic_links_token_hash` ON `admin_magic_links` (`token_hash`);--> statement-breakpoint
DROP INDEX `idx_waitlist_signups_email`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_waitlist_signups_email_source` ON `waitlist_signups` (`email`,`source`);