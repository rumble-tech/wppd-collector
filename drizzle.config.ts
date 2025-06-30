import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/components/database/Schema.ts',
    out: './src/components/database/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'sqlite:./sqlite/sqlite.db',
    },
});
