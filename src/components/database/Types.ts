import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { schema } from './Schema';

export type TDatabase = BetterSQLite3Database<typeof schema>;
export type TSitesTable = typeof schema.sitesTable;
export type TPluginsTable = typeof schema.pluginsTable;
export type TSitePluginsTable = typeof schema.sitePluginsTable;
export type TPluginVulnerabilitiesTable = typeof schema.pluginVulnerabilitiesTable;
