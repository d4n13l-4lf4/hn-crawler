import { After, Given, Then, When } from '@cucumber/cucumber';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

interface CommandResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

interface UsageWorld {
  result?: CommandResult;
  usageDbDir?: string;
  usageDbPath?: string;
}

Given(
  'a temporary usage database path is configured',
  function (this: UsageWorld) {
    this.usageDbDir = mkdtempSync(join(tmpdir(), 'hn-crawler-usage-'));
    this.usageDbPath = join(this.usageDbDir, 'usage.sqlite');
  }
);

After(function (this: UsageWorld) {
  if (this.usageDbDir) {
    rmSync(this.usageDbDir, { recursive: true, force: true });
  }
});

When(
  'I run the crawl command with the configured URL in beta mode using the temporary usage database',
  function (this: UsageWorld) {
    this.result = runCli(
      ['crawl', '--url', getAcceptanceUrl()],
      testDbEnvironment(this)
    );
    assert.equal(
      this.result.status,
      0,
      `Expected crawl to succeed; stderr: ${this.result.stderr}`
    );
  }
);

When(
  'I run the usage command using the same temporary usage database',
  function (this: UsageWorld) {
    this.result = runCli(['usage'], testDbEnvironment(this));
  }
);

When(
  'I run the usage command using the temporary usage database',
  function (this: UsageWorld) {
    this.result = runCli(['usage'], testDbEnvironment(this));
  }
);

When(
  'I run the usage command with an unsupported argument',
  function (this: UsageWorld) {
    this.result = runCli(['usage', '--unknown'], testDbEnvironment(this));
  }
);

Then('the usage command exits with code 0', function (this: UsageWorld) {
  assert.equal(
    this.result?.status,
    0,
    `Expected status 0; stderr: ${this.result?.stderr}`
  );
});

Then(
  'the usage command exits with a non-zero code',
  function (this: UsageWorld) {
    assert.notEqual(
      this.result?.status,
      0,
      `Expected non-zero status; stderr: ${this.result?.stderr}`
    );
  }
);

Then(
  'the usage table contains the persisted crawl record',
  function (this: UsageWorld) {
    const output = this.result?.stdout ?? '';
    assert.match(output, /Usage data/);
    assert.match(output, /Request Date and Time/);
    assert.match(output, /Applied Filters/);
    assert.match(output, /Duration \(ms\)/);
    assert.match(output, /sort:number_of_comments:desc/);
    assertLocalizedTimestamp(output);
  }
);

Then('the usage table columns are aligned', function (this: UsageWorld) {
  const lines = (this.result?.stdout ?? '').split('\n').filter(Boolean);
  const tableRows = lines.slice(1);
  assert.ok(tableRows.length >= 3, 'Expected header, separator, and data row');
  const boundaries = tableRows.map((line) => pipeBoundaries(line));
  for (const row of boundaries.slice(1)) {
    assert.deepEqual(row, boundaries[0]);
  }
});

Then(
  'the usage table has a heading and column headers but no records',
  function (this: UsageWorld) {
    const lines = (this.result?.stdout ?? '').trimEnd().split('\n');
    assert.equal(lines[0], 'Usage data');
    assert.match(lines[1] ?? '', /ID\s+\| Request Date and Time/);
    assert.match(lines[1] ?? '', /Applied Filters/);
    assert.match(lines[1] ?? '', /Duration \(ms\)/);
    assert.equal(
      lines.length,
      3,
      'Expected heading, headers, and separator only'
    );
  }
);

function testDbEnvironment(world: UsageWorld): Record<string, string> {
  assert.ok(
    world.usageDbPath,
    'Temporary usage database path was not configured'
  );
  return {
    HN_CRAWLER_DB_PATH: world.usageDbPath,
    HN_CRAWLER_USAGE_LIMIT: process.env.HN_CRAWLER_USAGE_LIMIT ?? '100',
    TZ: 'UTC',
  };
}

function getAcceptanceUrl(): string {
  const url = process.env.HN_CRAWLER_ACCEPTANCE_URL?.trim();
  assert.ok(
    url,
    'HN_CRAWLER_ACCEPTANCE_URL must be set to a deterministic page URL before running acceptance tests.'
  );
  return url;
}

function runCli(
  args: string[],
  extraEnv: Record<string, string>
): CommandResult {
  const result: SpawnSyncReturns<string> = spawnSync('hn-crawler', args, {
    encoding: 'utf8',
    env: { ...process.env, HN_CRAWLER_BETA: 'true', ...extraEnv },
    shell: false,
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

function pipeBoundaries(line: string): number[] {
  const positions: number[] = [];
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '|') positions.push(index);
  }
  return positions;
}

function assertLocalizedTimestamp(output: string): void {
  const timestampRow = output
    .split('\n')
    .find((line) =>
      /\| \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \([^)]+\)/.test(line)
    );
  assert.ok(
    timestampRow,
    'Expected a persisted usage row with a local timestamp and timezone label'
  );
}
