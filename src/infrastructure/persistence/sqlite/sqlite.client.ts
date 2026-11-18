import { drizzle } from 'drizzle-orm/node-sqlite';

export function createSqliteClient(databasePath: string) {
  return drizzle(databasePath);
}
