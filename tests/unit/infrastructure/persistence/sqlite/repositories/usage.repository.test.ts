import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Usage } from '@/domain/entities/usage.entity';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { migrateSqlite } from '@/infrastructure/persistence/sqlite/sqlite-migrator';
import { SqliteUsageRepository } from '@/infrastructure/persistence/sqlite/repositories/usage.repository';

vi.mock('@/infrastructure/persistence/sqlite/sqlite-migrator', () => ({
  migrateSqlite: vi.fn(),
}));
vi.mock('@/infrastructure/persistence/sqlite/migration-files', () => ({
  hasMigrationFiles: vi.fn().mockReturnValue(true),
}));

describe('SqliteUsageRepository', () => {
  let directory: string | undefined;
  let clients: ReturnType<typeof createSqliteClient>[] = [];

  afterEach(() => {
    clients.forEach((client) => client.$client.close());
    clients = [];
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
      directory = undefined;
    }
  });

  const filters = AppliedFilters.builder().sortBy('comments').build();
  const makeUsage = (suffix: string, timestamp: number) =>
    new Usage(
      `018f0f4b-7b7c-7abc-8def-0123456789${suffix}`,
      timestamp,
      filters,
      Math.floor(timestamp / 10)
    );
  const first = makeUsage('ab', 100);
  const second = makeUsage('ac', 100);
  const noFilters = AppliedFilters.builder().build();
  const noFilterUsage = new Usage(
    '018f0f4b-7b7c-7abc-8def-0123456789ad',
    101,
    noFilters,
    10
  );
  const titleFilterUsage = new Usage(
    '018f0f4b-7b7c-7abc-8def-0123456789ae',
    102,
    AppliedFilters.builder().titleWords({ operator: 'le', value: 5 }).build(),
    11
  );

  function createRepository(retentionLimit = 100): SqliteUsageRepository {
    directory ??= mkdtempSync(join(tmpdir(), 'hn-crawler-repository-'));
    const client = createSqliteClient(join(directory, 'usage.sqlite'));
    clients.push(client);
    client.$client.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        request_id text PRIMARY KEY,
        request_timestamp integer NOT NULL,
        applied_filters text NOT NULL,
        duration_ms integer NOT NULL
      )
    `);
    migrateSqlite(client);
    return new SqliteUsageRepository(client, retentionLimit);
  }

  const saveCases = [
    {
      should: 'map a usage entity to a database row and back',
      records: [first],
      expected: [first],
    },
    {
      should: 'map multiple usage entities to database rows and back',
      records: [first, second],
      expected: [first, second],
    },
    {
      should: 'store and retrieve applied filters as text',
      records: [noFilterUsage],
      expected: [noFilterUsage],
    },
    {
      should: 'store and retrieve title filters as text',
      records: [titleFilterUsage],
      expected: [titleFilterUsage],
    },
  ];

  it.each(saveCases)('should $should', async ({ records, expected }) => {
    const repository = createRepository();
    for (const record of records) {
      await repository.save(record);
    }
    const result = await repository.getAll();
    expect(result).toEqual(expected);
  });

  it('should return an empty list when no records are stored', async () => {
    const repository = createRepository();
    const result = await repository.getAll();
    expect(result).toEqual([]);
  });

  it('should retain records after the database is reopened', async () => {
    const repository = createRepository();
    await repository.save(first);

    const directoryPath = directory;
    const client = createSqliteClient(join(directoryPath!, 'usage.sqlite'));
    const repository2 = new SqliteUsageRepository(client, 100);
    const result = await repository2.getAll();
    expect(result).toEqual([first]);
    client.$client.close();
  });

  it('should keep the newest records within the configured retention limit', async () => {
    const repository = createRepository(1);
    await repository.save(first);
    await repository.save(second);

    const result = await repository.getAll();
    expect(result).toEqual([second]);
  });

  it('should prune older records when the retention limit is exceeded', async () => {
    const repository = createRepository(1);
    await repository.save(first);
    await repository.save(second);

    expect(await repository.getAll()).toEqual([second]);

    const third = makeUsage('cd', 200);
    await repository.save(third);

    expect(await repository.getAll()).toEqual([third]);
  });

  it('should roll back the inserted record when retention pruning fails', async () => {
    createRepository();
    const failingClient = createSqliteClient(join(directory!, 'usage.sqlite'));
    failingClient.$client.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        request_id text PRIMARY KEY,
        request_timestamp integer NOT NULL,
        applied_filters text NOT NULL,
        duration_ms integer NOT NULL
      )
    `);
    const failingRepository = new SqliteUsageRepository(failingClient, 100);

    expect(() => failingRepository.save(first)).not.toThrow();
    expect(failingRepository.getAll()).toEqual([first]);

    expect(() => failingRepository.save(first)).toThrow();
    expect(failingRepository.getAll()).toEqual([first]);

    failingClient.$client.close();
  });

  it('should fail without leaving a partial record when insertion fails', async () => {
    const repository = createRepository();
    await repository.save(first);

    const failingClient = createSqliteClient(join(directory!, 'usage.sqlite'));
    failingClient.$client.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        request_id text PRIMARY KEY,
        request_timestamp integer NOT NULL,
        applied_filters text NOT NULL,
        duration_ms integer NOT NULL
      )
    `);
    const failingRepository = new SqliteUsageRepository(failingClient, 100);

    const badUsage = new Usage(first.request_id, 999, filters, 999);
    expect(() => failingRepository.save(badUsage)).toThrow();
    expect(failingRepository.getAll()).toEqual([first]);

    failingClient.$client.close();
  });
});
