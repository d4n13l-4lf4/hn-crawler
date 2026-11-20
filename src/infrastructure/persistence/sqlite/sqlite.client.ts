import { drizzle } from 'drizzle-orm/better-sqlite3';

export function createSqliteClient(databasePath: string) {
  return drizzle(databasePath);
}
