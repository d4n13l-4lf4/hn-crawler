import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { usage } from '@/infrastructure/persistence/sqlite/schema/usage.schema';

describe('Usage schema unit test', () => {
  it('should define the usage table with the persisted entity columns', () => {
    const table = getTableConfig(usage);

    expect(table.name).toBe('usage');
    expect(
      table.columns.map(({ name, notNull, primary }) => ({
        name,
        notNull,
        primary,
      }))
    ).toEqual([
      { name: 'request_id', notNull: true, primary: true },
      { name: 'request_timestamp', notNull: true, primary: false },
      { name: 'applied_filters', notNull: true, primary: false },
      { name: 'duration_ms', notNull: true, primary: false },
    ]);
  });
});
