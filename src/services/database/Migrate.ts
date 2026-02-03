import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { database } from './Database';

migrate(database, { migrationsFolder: path.resolve('sqlite/migrations') });
