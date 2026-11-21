import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CrawlerPort } from '@/application/ports/in/crawler.port';
import { TrackedCrawlerUseCase } from '@/application/usecases/decorators/tracked-crawler.usecase';
import { HNEntry } from '@/domain/entities/hn-entry.entity';
import { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { migrateSqlite } from '@/infrastructure/persistence/sqlite/sqlite-migrator';
import { SqliteUsageRepository } from '@/infrastructure/persistence/sqlite/repositories/usage.repository';

vi.mock('@/infrastructure/persistence/sqlite/sqlite-migrator', () => ({
  migrateSqlite: vi.fn(),
}));
vi.mock('@/infrastructure/persistence/sqlite/migration-files', () => ({
  hasMigrationFiles: vi.fn().mockReturnValue(true),
}));

describe('TrackedCrawlerUseCase with SQLite', () => {
  let directory: string | undefined;
  let client: ReturnType<typeof createSqliteClient> | undefined;

  afterEach(() => {
    client?.$client.close();
    client = undefined;
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
      directory = undefined;
    }
  });

  function createRepository(): SqliteUsageRepository {
    directory = mkdtempSync(join(tmpdir(), 'hn-crawler-tracked-'));
    client = createSqliteClient(join(directory, 'usage.sqlite'));
    client.$client.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        request_id text PRIMARY KEY,
        request_timestamp integer NOT NULL,
        applied_filters text NOT NULL,
        duration_ms integer NOT NULL
      )
    `);
    migrateSqlite(client);
    return new SqliteUsageRepository(client, 100);
  }

  it('should preserve the successful crawl result when SQLite save fails', async () => {
    const repository = createRepository();
    const execute = vi.fn().mockResolvedValue([new HNEntry(1, 'Story', 1, 1)]);
    const crawler = new TrackedCrawlerUseCase(
      { execute } satisfies CrawlerPort,
      repository,
      () => 123,
      vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(12),
      () => '018f0f4b-7b7c-7abc-8def-0123456789ab'
    );
    client!.$client.exec(`CREATE TRIGGER fail_usage_save
      BEFORE INSERT ON usage
      BEGIN
        SELECT RAISE(ABORT, 'write failed');
      END;`);
    const request = {
      maxEntries: 30,
      sortBy: 'comments',
    } as const;

    const result = await crawler.execute(request);

    expect(result).toEqual([new HNEntry(1, 'Story', 1, 1)]);
    expect(execute).toHaveBeenCalledWith(request);
    expect(await repository.getAll()).toEqual([]);
  });

  it('should preserve the original crawl error when SQLite save fails', async () => {
    const repository = createRepository();
    const crawlFailure = new Error('crawl failed');
    const execute = vi.fn().mockRejectedValue(crawlFailure);
    const crawler = new TrackedCrawlerUseCase(
      { execute },
      repository,
      () => 123,
      vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(12),
      () => '018f0f4b-7b7c-7abc-8def-0123456789ab'
    );
    client!.$client.exec(`CREATE TRIGGER fail_usage_save
      BEFORE INSERT ON usage
      BEGIN
        SELECT RAISE(ABORT, 'write failed');
      END;`);
    const request = { maxEntries: 30, sortBy: 'points' } as const;

    await expect(crawler.execute(request)).rejects.toBe(crawlFailure);

    expect(execute).toHaveBeenCalledWith(request);
    expect(await repository.getAll()).toEqual([]);
  });
});
