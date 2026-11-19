import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Usage } from '@/domain/entities/usage.entity';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';
import { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { migrateSqlite } from '@/infrastructure/persistence/sqlite/sqlite-migrator';
import { SqliteUsageRepository } from '@/infrastructure/persistence/sqlite/repositories/usage.repository';

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
      should: 'return rows in insertion order when timestamps are equal',
      records: [first, second],
      expected: [first, second],
    },
    {
      should:
        'restore none and filter-only descriptions without schema changes',
      records: [noFilterUsage, titleFilterUsage],
      expected: [noFilterUsage, titleFilterUsage],
    },
  ];

  it.each(saveCases)('should $should', async ({ records, expected }) => {
    const repository = createRepository();

    for (const record of records) await repository.save(record);

    expect(await repository.getAll()).toEqual(expected);
  });

  it('should return an empty list when no records are stored', async () => {
    expect(await createRepository().getAll()).toEqual([]);
  });

  it('should retain records after the database is reopened', async () => {
    const repository = createRepository();
    await repository.save(first);
    clients[0].$client.close();
    clients = [];

    const reopenedClient = createSqliteClient(join(directory!, 'usage.sqlite'));
    clients.push(reopenedClient);
    const reopenedRepository = new SqliteUsageRepository(reopenedClient, 100);

    expect(await reopenedRepository.getAll()).toEqual([first]);
  });

  const retentionCases = [
    {
      should: 'keep the newest records within the configured limit',
      retentionLimit: 2,
      records: [first, second, makeUsage('ad', 300)],
      expected: [second, makeUsage('ad', 300)],
    },
    {
      should: 'prune older records when the configured limit is reduced',
      retentionLimit: 1,
      records: [first, second],
      expected: [second],
    },
  ];

  it.each(retentionCases)(
    'should $should',
    async ({ retentionLimit, records, expected }) => {
      const repository = createRepository(retentionLimit);
      for (const record of records) await repository.save(record);

      expect(await repository.getAll()).toEqual(expected);
    }
  );

  it('should retain the newest 100 records by default', () => {
    const repository = createRepository();
    const records = Array.from({ length: 101 }, (_, index) =>
      makeUsage(index.toString(16).padStart(2, '0'), index + 1)
    );

    for (const record of records) repository.save(record);

    expect(repository.getAll()).toEqual(records.slice(1));
  });

  it('should roll back the inserted record when retention pruning fails', () => {
    const repository = createRepository(1);
    const client = clients[0];
    client.$client.exec(`CREATE TRIGGER fail_usage_prune
      BEFORE DELETE ON usage
      BEGIN
        SELECT RAISE(ABORT, 'prune failed');
      END;`);
    repository.save(first);

    expect(() => repository.save(second)).toThrow();
    expect(
      client.$client.prepare('SELECT request_id FROM usage').all()
    ).toEqual([{ request_id: first.request_id }]);
  });

  it('should fail without leaving a partial record when insertion fails', () => {
    const repository = createRepository();
    repository.save(first);

    expect(() => repository.save(first)).toThrow();
    expect(repository.getAll()).toEqual([first]);
  });
});
