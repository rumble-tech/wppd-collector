import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { dbSchema } from './Schema';

export type TDatabase = BetterSQLite3Database<typeof dbSchema>;
export type TSitesTable = typeof dbSchema.sitesTable;
export type TPluginsTable = typeof dbSchema.pluginsTable;
export type TSitePluginsTable = typeof dbSchema.sitePluginsTable;
export type TPluginVulnerabilitiesTable = typeof dbSchema.pluginVulnerabilitiesTable;
