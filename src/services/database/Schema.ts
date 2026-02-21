import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const environmentEnum = ['production', 'staging', 'development'] as const;

export const sitesTable = sqliteTable('sites', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    apiKey: text('api_key').notNull(),
    environment: text('environment', { enum: environmentEnum }).notNull(),
    phpVersion: text('php_version'),
    wpVersion: text('wp_version'),
});

export const pluginsTable = sqliteTable('plugins', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    latestVersion: text('latest_version'),
    requiredPhpVersion: text('required_php_version'),
    requiredWpVersion: text('required_wp_version'),
});

export const sitePluginsTable = sqliteTable('site_plugins', {
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    siteId: integer('site_id')
        .notNull()
        .references(() => sitesTable.id, { onDelete: 'cascade' }),
    pluginId: integer('plugin_id')
        .notNull()
        .references(() => pluginsTable.id, { onDelete: 'cascade' }),
    installedVersion: text('installed_version'),
    requiredPhpVersion: text('required_php_version'),
    requiredWpVersion: text('required_wp_version'),
    isActive: integer('is_active').notNull().default(0),
});

export const pluginVulnerabilitiesTable = sqliteTable('plugin_vulnerabilities', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    pluginId: integer('plugin_id')
        .notNull()
        .references(() => pluginsTable.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
    severity: numeric('severity').notNull(),
    references: text('references'),
    fromVersion: text('from_version').notNull(),
    fromVersionInclusive: integer('from_version_inclusive').notNull().default(1),
    toVersion: text('to_version').notNull(),
    toVersionInclusive: integer('to_version_inclusive').notNull().default(1),
});

export const dbSchema = {
    sitesTable,
    pluginsTable,
    sitePluginsTable,
    pluginVulnerabilitiesTable,
};
