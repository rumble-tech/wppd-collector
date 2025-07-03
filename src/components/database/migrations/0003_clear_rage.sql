CREATE TABLE `plugin_vulnerabilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plugin_id` integer NOT NULL,
	`from` text NOT NULL,
	`from_inclusive` integer DEFAULT 0 NOT NULL,
	`to` text NOT NULL,
	`to_inclusive` integer DEFAULT 0 NOT NULL,
	`score` numeric NOT NULL,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
