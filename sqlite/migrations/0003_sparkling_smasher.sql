CREATE TABLE `plugin_vulnerabilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`plugin_id` integer NOT NULL,
	`description` text NOT NULL,
	`published_at` integer NOT NULL,
	`severity` numeric NOT NULL,
	`references` text,
	`from_version` text NOT NULL,
	`from_version_inclusive` integer DEFAULT 1 NOT NULL,
	`to_version` text NOT NULL,
	`to_version_inclusive` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
