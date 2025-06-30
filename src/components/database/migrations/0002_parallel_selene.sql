CREATE TABLE `site_plugins` (
	`site_id` integer NOT NULL,
	`plugin_id` integer NOT NULL,
	`installed_version` text,
	`required_php_version` text,
	`required_wp_version` text,
	`is_active` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON UPDATE no action ON DELETE cascade
);
