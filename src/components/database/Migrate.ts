import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './Database';

migrate(db, { migrationsFolder: 'src/components/database/migrations' });
