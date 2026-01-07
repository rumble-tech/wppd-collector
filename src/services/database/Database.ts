import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { dbSchema } from './Schema';

const sqlite3 = new Database('sqlite/sqlite.db');
export const database = drizzle(sqlite3, { schema: dbSchema });
export { dbSchema };
