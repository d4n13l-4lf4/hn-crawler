import { createContainer } from '@/bootstrap/container';
import { config } from '@/config/config';
import { getSqlitePath } from '@/infrastructure/persistence/sqlite/sqlite-path';
import { createCli } from '@/presentation/cli/cli';
import { createCrawlCommand } from '@/presentation/cli/crawl';
import { createUsageCommand } from '@/presentation/cli/usage';
import {
  SqliteClient,
  SqliteMigrator,
  TrackedCrawlerUseCase as TrackedCrawlerUseCaseToken,
  UsageQueryUseCase as UsageQueryUseCaseToken,
} from '@/bootstrap/tokens';

async function main(): Promise<void> {
  const databasePath = await getSqlitePath(config.usageDatabasePath);
  const container = createContainer(databasePath);

  const database = container.get(SqliteClient);
  const migrator = container.get(SqliteMigrator);

  try {
    migrator(database);

    const trackedCrawler = container.get(TrackedCrawlerUseCaseToken);
    const usageQuery = container.get(UsageQueryUseCaseToken);

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
