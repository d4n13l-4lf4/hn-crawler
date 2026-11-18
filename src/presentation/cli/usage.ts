import { Command } from 'commander';
import type { UsageRepositoryPort } from '@/application/ports/out/usage-repository.port';
import { Usage } from '@/domain/entities/usage.entity';

const USAGE_ERROR = 'An error occurred while retrieving usage statistics.';

export function createUsageCommand(repository: UsageRepositoryPort): Command {
  const command = new Command('usage').description(
    'Display current process usage statistics'
  );

  command.action(async () => {
    try {
      const records = await repository.getAll();
      console.log(JSON.stringify(records.map(serializeUsage), null, 2));
    } catch {
      console.error(USAGE_ERROR);
      process.exitCode = 1;
    }
  });

  return command;
}

function serializeUsage(usage: Usage) {
  return {
    request_id: usage.request_id,
    request_timestamp: usage.request_timestamp,
    applied_filters: usage.applied_filters.toString(),
    duration_ms: usage.duration_ms,
  };
}
