#!/usr/bin/env node

import { CrawlerUseCase } from '@/application/usecases/crawler.usecase';
import { TrackedCrawlerUseCase } from '@/application/usecases/decorators/tracked-crawler.usecase';
import { UsageQueryUseCase } from '@/application/usecases/usage-query.usecase';
import { pipelineFactory } from '@/application/pipeline/factory/factory';
import { config } from '@/config/config';
import { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';
import { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { migrateSqlite } from '@/infrastructure/persistence/sqlite/sqlite-migrator';
import { getSqlitePath } from '@/infrastructure/persistence/sqlite/sqlite-path';
import { SqliteUsageRepository } from '@/infrastructure/persistence/sqlite/repositories/usage.repository';
import { createCli } from '@/presentation/cli/cli';
import { createCrawlCommand } from '@/presentation/cli/crawl';
import { createUsageCommand } from '@/presentation/cli/usage';

async function main(): Promise<void> {
  const databasePath = await getSqlitePath(config.usageDatabasePath);
  const database = createSqliteClient(databasePath);

  try {
    migrateSqlite(database);
    const usageRepository = new SqliteUsageRepository(
      database,
      config.usageRetentionLimit
    );
    const usageQuery = new UsageQueryUseCase(usageRepository);
    const entrySource = new HnWebAdapter();
    const crawler = new CrawlerUseCase(entrySource, pipelineFactory);
    const trackedCrawler = new TrackedCrawlerUseCase(crawler, usageRepository);

    const cli = createCli([
      createCrawlCommand(trackedCrawler),
      createUsageCommand(usageQuery),
    ]);
    await cli.parseAsync(process.argv);
  } catch (error) {
    process.stderr.write(
      error instanceof Error
        ? `An error occurred during startup: ${error.message}`
        : 'An error occurred during startup.'
    );
    process.stderr.write('\n');
    process.exitCode = 1;
  } finally {
    database.$client.close();
  }
}

void main();
