import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

export const dbSchema = {
    sitesTable,
};
