import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './Schema';

const sqlite3 = new Database('sqlite/sqlite.db');
export const db = drizzle(sqlite3, { schema });
export { schema };
