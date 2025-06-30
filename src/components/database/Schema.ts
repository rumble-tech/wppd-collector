import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sitesTable = sqliteTable('sites', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    url: text('url').notNull(),
});
