import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const environmentEnum = ['production', 'staging', 'development'] as const;

export const sitesTable = sqliteTable('sites', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    phpVersion: text('php_version'),
    wpVersion: text('wp_version'),
    token: text('token').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    url: text('url').notNull(),
    environment: text('environment', { enum: environmentEnum }).notNull().default('production'),
});

export const pluginsTable = sqliteTable('plugins', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    latestVersion: text('latest_version'),
    requiredPhpVersion: text('latest_php_version'),
    requiredWpVersion: text('latest_wp_version'),
});

export const sitePluginsTable = sqliteTable('site_plugins', {
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
    pluginId: integer('plugin_id')
        .notNull()
        .references(() => pluginsTable.id, { onDelete: 'cascade' }),
    from: text('from').notNull(),
    fromInclusive: integer('from_inclusive').notNull().default(0),
    to: text('to').notNull(),
    toInclusive: integer('to_inclusive').notNull().default(0),
    score: numeric('score').$type<number>().notNull(),
});

export const schema = {
    sitesTable,
    pluginsTable,
    sitePluginsTable,
    pluginVulnerabilitiesTable,
};
