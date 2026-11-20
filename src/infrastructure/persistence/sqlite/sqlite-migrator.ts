import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { hasMigrationFiles } from '@/infrastructure/persistence/sqlite/migration-files';

type SqliteClient = ReturnType<typeof createSqliteClient>;

const MIGRATION_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../drizzle/migrations'
);

export function migrateSqlite(client: SqliteClient): void {
  if (!hasMigrationFiles(MIGRATION_DIRECTORY)) {
    throw new Error(
      `SQLite migration files not found in: ${MIGRATION_DIRECTORY}`
    );
  }

  migrate(client, { migrationsFolder: MIGRATION_DIRECTORY });
}
