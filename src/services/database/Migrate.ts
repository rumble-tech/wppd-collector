import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { database } from './Database';

migrate(database, { migrationsFolder: 'sqlite/migrations' });
