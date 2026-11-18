import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function hasMigrationFiles(migrationsDirectory: string): boolean {
  return (
    existsSync(migrationsDirectory) &&
    readdirSync(migrationsDirectory, { withFileTypes: true }).some(
      (entry) =>
        entry.isDirectory() &&
        existsSync(resolve(migrationsDirectory, entry.name, 'migration.sql'))
    )
  );
}
