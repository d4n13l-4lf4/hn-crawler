import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-sqlite/migrator';
import type { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { hasMigrationFiles } from '@/infrastructure/persistence/sqlite/migration-files';

type SqliteClient = ReturnType<typeof createSqliteClient>;

const MIGRATIONS_DIRECTORY = resolve(
  __dirname,
  '../../../../drizzle/migrations'
);

export function migrateSqlite(client: SqliteClient): void {
  if (!hasMigrationFiles(MIGRATIONS_DIRECTORY)) {
    throw new Error(
      `SQLite migration files not found in: ${MIGRATIONS_DIRECTORY}`
    );
  }

  migrate(client, { migrationsFolder: MIGRATIONS_DIRECTORY });
}
