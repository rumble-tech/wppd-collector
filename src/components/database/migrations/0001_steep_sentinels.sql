CREATE TABLE `plugins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`latest_version` text,
	`latest_php_version` text,
	`latest_wp_version` text
);
