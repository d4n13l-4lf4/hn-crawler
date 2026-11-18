import { Command } from 'commander';
import type { UsageQueryPort } from '@/application/ports/in/usage-query.port';
import { Usage } from '@/domain/entities/usage.entity';

const USAGE_ERROR = 'An error occurred while retrieving usage statistics.';

export function createUsageCommand(usageQuery: UsageQueryPort): Command {
  const command = new Command('usage').description(
    'Display current process usage statistics'
  );

  command.action(async () => {
    try {
      const records = await usageQuery.getAll();
      console.log(formatUsageTable(records));
    } catch {
      console.error(USAGE_ERROR);
      process.exitCode = 1;
    }
  });

  return command;
}

type UsageRow = [string, string, string, string];

const HEADERS: UsageRow = [
  'ID',
  'Request Timestamp',
  'Applied Filters',
  'Duration (ms)',
];

function formatCell(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function toRow(record: Usage): UsageRow {
  return [
    formatCell(record.request_id),
    String(record.request_timestamp),
    formatCell(record.applied_filters.toString()),
    String(record.duration_ms),
  ];
}

function formatUsageTable(records: Usage[]): string {
  const rows = records.map(toRow);
  const widths = HEADERS.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length))
  );
  const formatRow = (row: UsageRow, numeric = false) =>
    row
      .map((cell, index) =>
        numeric && (index === 1 || index === 3)
          ? cell.padStart(widths[index])
          : cell.padEnd(widths[index])
      )
      .join(' | ');
  const header = formatRow(HEADERS);
  const separator = widths.map((width) => '-'.repeat(width)).join('-|-');

  return [
    'Usage data',
    header,
    separator,
    ...rows.map((row) => formatRow(row, true)),
  ].join('\n');
}
