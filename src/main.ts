import { createContainer } from '@/bootstrap/container';
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
  let database;

  try {
    const container = createContainer();

    database = await container.getAsync(SqliteClient);
    const migrator = container.get(SqliteMigrator);

    migrator(database);

    const trackedCrawler = await container.getAsync(TrackedCrawlerUseCaseToken);
    const usageQuery = await container.getAsync(UsageQueryUseCaseToken);

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
    database?.$client.close();
  }
}

void main();
