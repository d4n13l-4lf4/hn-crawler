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
  'Request Date and Time',
  'Applied Filters',
  'Duration (ms)',
];

type TimestampParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  timeZone: string;
};

const UTC_TIME_ZONE = 'UTC';

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) {
    throw new Error('Invalid usage timestamp');
  }

  const local = getTimestampParts(date, undefined);
  if (local && isUsefulTimeZone(local.timeZone)) {
    return formatTimestampParts(local);
  }

  const utc = getTimestampParts(date, UTC_TIME_ZONE);
  return formatTimestampParts(utc!);
}

function getTimestampParts(
  date: Date,
  timeZone: string | undefined
): TimestampParts | undefined {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  });
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  const [year, month, day, hour, minute, second, zone] = [
    value('year'),
    value('month'),
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
    value('timeZoneName'),
  ];

  return { year, month, day, hour, minute, second, timeZone: zone };
}

function isUsefulTimeZone(timeZone: string): boolean {
  return timeZone !== 'GMT';
}

function formatTimestampParts(parts: TimestampParts): string {
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} (${parts.timeZone})`;
}

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
    formatTimestamp(record.request_timestamp),
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
