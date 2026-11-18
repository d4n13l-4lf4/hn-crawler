import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { migrateMock } = vi.hoisted(() => ({ migrateMock: vi.fn() }));
vi.mock('drizzle-orm/node-sqlite/migrator', () => ({
  migrate: migrateMock,
}));

import { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { migrateSqlite } from '@/infrastructure/persistence/sqlite/sqlite-migrator';
import { hasMigrationFiles } from '@/infrastructure/persistence/sqlite/migration-files';

vi.mock('@/infrastructure/persistence/sqlite/migration-files', () => ({
  hasMigrationFiles: vi.fn(),
}));

describe('migrateSqlite', () => {
  let directory: string | undefined;
  let client: ReturnType<typeof createSqliteClient> | undefined;

  afterEach(() => {
    client?.$client.close();
    client = undefined;
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
      directory = undefined;
    }
    migrateMock.mockReset();
    vi.mocked(hasMigrationFiles).mockReset().mockReturnValue(true);
  });

  const cases = [
    {
      should: 'apply migrations to the supplied database client',
      implementation: () => undefined,
      shouldReject: false,
    },
    {
      should: 'propagate a migration failure without obscuring it',
      implementation: () => {
        throw new Error('migration failed');
      },
      shouldReject: true,
    },
  ];

  it.each(cases)('should $should', ({ implementation, shouldReject }) => {
    directory = mkdtempSync(join(tmpdir(), 'hn-crawler-migration-'));
    client = createSqliteClient(join(directory, 'usage.sqlite'));
    vi.mocked(hasMigrationFiles).mockReturnValue(true);
    migrateMock.mockImplementation(implementation);

    if (shouldReject) {
      expect(() => migrateSqlite(client!)).toThrow('migration failed');
    } else {
      expect(migrateSqlite(client!)).toBeUndefined();
    }

    expect(migrateMock).toHaveBeenCalledTimes(1);
    expect(migrateMock).toHaveBeenCalledWith(client, {
      migrationsFolder: expect.stringContaining('drizzle/migrations'),
    });
    expect(hasMigrationFiles).toHaveBeenCalledWith(
      expect.stringContaining('drizzle/migrations'),
      0,
      expect.any(Array)
    );
    expect(client.$client).toBeInstanceOf(DatabaseSync);
  });

  it('should apply migrations repeatedly during repeated startup', () => {
    directory = mkdtempSync(join(tmpdir(), 'hn-crawler-migration-'));
    client = createSqliteClient(join(directory, 'usage.sqlite'));
    vi.mocked(hasMigrationFiles).mockReturnValue(true);

    migrateSqlite(client);
    migrateSqlite(client);

    expect(migrateMock).toHaveBeenCalledTimes(2);
    expect(migrateMock).toHaveBeenNthCalledWith(1, client, {
      migrationsFolder: expect.stringContaining('drizzle/migrations'),
    });
    expect(migrateMock).toHaveBeenNthCalledWith(2, client, {
      migrationsFolder: expect.stringContaining('drizzle/migrations'),
    });
    expect(hasMigrationFiles).toHaveBeenCalledTimes(2);
  });

  it('should fail with the expected path when migrations are missing', () => {
    directory = mkdtempSync(join(tmpdir(), 'hn-crawler-migration-'));
    client = createSqliteClient(join(directory, 'usage.sqlite'));
    vi.mocked(hasMigrationFiles).mockReturnValue(false);

    expect(() => migrateSqlite(client!)).toThrow(
      'SQLite migration files not found in:'
    );
    expect(hasMigrationFiles).toHaveBeenCalledTimes(2);
    expect(migrateMock).not.toHaveBeenCalled();
  });
});
