import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-sqlite/migrator';
import type { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { hasMigrationFiles } from '@/infrastructure/persistence/sqlite/migration-files';

type SqliteClient = ReturnType<typeof createSqliteClient>;

const MIGRATION_DIRECTORY_CANDIDATES = [
  resolve(__dirname, '../../../../drizzle/migrations'),
  resolve(__dirname, '../../../drizzle/migrations'),
];

export function migrateSqlite(client: SqliteClient): void {
  const migrationsDirectory =
    MIGRATION_DIRECTORY_CANDIDATES.find(hasMigrationFiles);

  if (!migrationsDirectory) {
    throw new Error(
      `SQLite migration files not found in: ${MIGRATION_DIRECTORY_CANDIDATES.join(', ')}`
    );
  }

  migrate(client, { migrationsFolder: migrationsDirectory });
}
