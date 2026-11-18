import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/infrastructure/persistence/sqlite/schema/usage.schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: './usage.sqlite',
  },
});
