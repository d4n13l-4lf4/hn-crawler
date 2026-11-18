import { Given, Then, When } from '@cucumber/cucumber';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { join } from 'node:path';
import assert from 'node:assert/strict';

interface CommandResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

Given('the configured acceptance crawl URL is available', function () {
  getAcceptanceUrl();
});

When(
  'I run the crawl command with the configured URL in beta mode',
  function () {
    this.result = runCli(['crawl', '--url', getAcceptanceUrl()], {
      HN_CRAWLER_BETA: 'true',
    });
  }
);

When(
  'I run {string} in production mode',
  function (this: { result?: CommandResult }, command: string) {
    this.result = runCli(command.split(' ').slice(1), {
      HN_CRAWLER_BETA: '',
    });
  }
);

Then(
  'the crawl output is a JSON array with {int} entries in page order',
  function (this: { result?: CommandResult }, count: number) {
    const entries = parseOutput(this.result).stdout;
    assert.equal(entries.length, count);
    assert.deepEqual(
      entries.map((entry) => entry.rank),
      Array.from({ length: count }, (_, index) => index + 1)
    );
  }
);

Then(
  'the first entry is rank {int} titled {string} with {int} points and {int} comments',
  function (
    this: { result?: CommandResult },
    rank: number,
    title: string,
    points: number,
    comments: number
  ) {
    assert.deepEqual(parseOutput(this.result).stdout[0], {
      rank,
      title,
      points,
      number_of_comments: comments,
    });
  }
);

Then(
  'the first entry title is {string}',
  function (this: { result?: CommandResult }, title: string) {
    assert.equal(parseOutput(this.result).stdout[0]?.title, title);
  }
);

Then(
  'I should see {string} in the error output',
  function (this: { result?: CommandResult }, expected: string) {
    assert.ok(
      this.result?.stderr.includes(expected),
      `Expected stderr to include ${JSON.stringify(expected)}, got ${this.result?.stderr}`
    );
  }
);

Then(
  'I should see the standard CLI usage error in the error output',
  function (this: { result?: CommandResult }) {
    assert.ok(
      this.result?.stderr.includes('error: unknown option'),
      `Expected a standard unknown-option error, got ${this.result?.stderr}`
    );
  }
);

Then(
  'I should not see {string} in the output',
  function (this: { result?: CommandResult }, unexpected: string) {
    assert.ok(
      !`${this.result?.stdout}\n${this.result?.stderr}`.includes(unexpected)
    );
  }
);

Then(
  'the crawl exit code should be 0',
  function (this: { result?: CommandResult }) {
    assert.equal(
      this.result?.status,
      0,
      `Expected status 0, got ${this.result?.status}; stderr: ${this.result?.stderr}`
    );
  }
);

Then(
  'the crawl exit code should be non-zero',
  function (this: { result?: CommandResult }) {
    assert.notEqual(
      this.result?.status,
      0,
      `Expected non-zero status; stdout: ${this.result?.stdout}; stderr: ${this.result?.stderr}`
    );
  }
);

function getAcceptanceUrl(): string {
  const url = process.env.HN_CRAWLER_ACCEPTANCE_URL?.trim();
  assert.ok(
    url,
    'HN_CRAWLER_ACCEPTANCE_URL must be set to a deterministic page URL before running acceptance tests.'
  );
  return url;
}

function runCli(args: string[], env: Record<string, string>): CommandResult {
  const binary =
    process.env.HN_CRAWLER_BIN ??
    join(process.cwd(), 'dist/presentation/main.js');
  const result: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    [binary, ...args],
    {
      encoding: 'utf8',
      env: { ...process.env, ...env },
    }
  );
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

function parseOutput(result?: CommandResult): {
  stdout: Array<Record<string, unknown>>;
} {
  assert.ok(result, 'Command was not executed');
  try {
    return {
      stdout: JSON.parse(result.stdout) as Array<Record<string, unknown>>,
    };
  } catch (error) {
    assert.fail(
      `Expected JSON output; got ${result.stdout}. Stderr: ${result.stderr}. Error: ${String(error)}`
    );
  }
}
