CREATE TABLE `plugins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`latest_version` text,
	`required_php_version` text,
	`required_wp_version` text
);
