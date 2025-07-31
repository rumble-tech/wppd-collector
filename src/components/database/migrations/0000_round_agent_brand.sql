CREATE TABLE `sites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`php_version` text,
	`wp_version` text,
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`url` text NOT NULL,
	`environment` text DEFAULT 'production' NOT NULL
);
