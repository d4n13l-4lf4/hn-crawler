import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usage = sqliteTable('usage', {
  request_id: text('request_id').primaryKey().notNull(),
  request_timestamp: integer('request_timestamp').notNull(),
  applied_filters: text('applied_filters').notNull(),
  duration_ms: integer('duration_ms').notNull(),
});
