import { Given, Then, When } from '@cucumber/cucumber';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import assert from 'node:assert/strict';

interface CommandResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

Given('the configured acceptance crawl URL is available', function () {
  getAcceptanceUrl();
});

When('I run the crawl command', function () {
  this.result = runCli(['crawl']);
});

When(
  'I run the crawl command with ranking {string}',
  function (this: { result?: CommandResult }, ranking: string) {
    this.result = runCli([
      'crawl',
      '--title-words',
      'le:10000',
      ranking === 'comments' ? '--top-comments' : '--top-points',
    ]);
  }
);

When('I run the crawl command with default options', function () {
  this.result = runCli(['crawl']);
});

When(
  'I run the crawl command with title filter {string}',
  function (this: { result?: CommandResult }, filter: string) {
    this.result = runCli(['crawl', '--title-words', filter]);
  }
);

When(
  'I run the crawl command with title filter {string} and ranking {string}',
  function (this: { result?: CommandResult }, filter: string, ranking: string) {
    this.result = runCli([
      'crawl',
      '--title-words',
      filter,
      ranking === 'comments' ? '--top-comments' : '--top-points',
    ]);
  }
);

When(
  'I run the crawl command with ranking {string} and no title filter',
  function (this: { result?: CommandResult }, ranking: string) {
    this.result = runCli([
      'crawl',
      ranking === 'comments' ? '--top-comments' : '--top-points',
    ]);
  }
);

When('I run the crawl command with conflicting ranking options', function () {
  this.result = runCli(['crawl', '--top-comments', '--top-points']);
});

When('I run the crawl command with an invalid URL', function () {
  this.result = runCli(['crawl'], { HN_CRAWLER_WEB_PAGE_BASE_URL: 'fake' });
});

Then(
  'the crawl output is a JSON array with at most 30 entries',
  function (this: { result?: CommandResult }) {
    assert.ok(parseOutput(this.result).stdout.length <= 30);
  }
);

Then(
  'the crawl output should be a JSON array',
  function (this: { result?: CommandResult }) {
    assert.ok(Array.isArray(parseOutput(this.result).stdout));
  }
);

Then(
  'the crawl output should contain only titles with more than {int} words',
  function (this: { result?: CommandResult }, count: number) {
    for (const entry of parseOutput(this.result).stdout) {
      assert.ok(countWords(String(entry.title)) > count);
    }
  }
);

Then(
  'the crawl output should contain only titles with at most {int} words',
  function (this: { result?: CommandResult }, count: number) {
    for (const entry of parseOutput(this.result).stdout) {
      assert.ok(countWords(String(entry.title)) <= count);
    }
  }
);

Then(
  'the crawl output should be ordered by comments descending',
  function (this: { result?: CommandResult }) {
    assertDescending(parseOutput(this.result).stdout, 'number_of_comments');
  }
);

Then(
  'the crawl output should be ordered by points descending',
  function (this: { result?: CommandResult }) {
    assertDescending(parseOutput(this.result).stdout, 'points');
  }
);

Then(
  'the crawl output should preserve source order',
  function (this: { result?: CommandResult }) {
    const entries = parseOutput(this.result).stdout;
    for (let index = 1; index < entries.length; index += 1) {
      assert.ok(
        Number(entries[index - 1].rank) < Number(entries[index].rank),
        'Expected results to retain increasing Hacker News rank'
      );
    }
  }
);

Then(
  'the crawl output should contain all available entries without a ranking assertion',
  function (this: { result?: CommandResult }) {
    const entries = parseOutput(this.result).stdout;
    assert.ok(entries.length <= 30);
  }
);

Then(
  'every output entry should contain exactly the established story fields',
  function (this: { result?: CommandResult }) {
    for (const entry of parseOutput(this.result).stdout) {
      assert.deepEqual(Object.keys(entry).sort(), [
        'number_of_comments',
        'points',
        'rank',
        'title',
      ]);
    }
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
  const url = process.env.HN_CRAWLER_WEB_PAGE_BASE_URL?.trim();
  assert.ok(
    url,
    'HN_CRAWLER_WEB_PAGE_BASE_URL must be set to a deterministic page URL before running acceptance tests.'
  );
  return url;
}

function runCli(
  args: string[],
  env: Record<string, string> = {}
): CommandResult {
  const result: SpawnSyncReturns<string> = spawnSync('hn-crawler', args, {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    shell: false,
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

function countWords(title: string): number {
  return title
    .trim()
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function assertDescending(
  entries: Array<Record<string, unknown>>,
  property: string
): void {
  for (let index = 1; index < entries.length; index += 1) {
    assert.ok(
      Number(entries[index - 1][property]) >= Number(entries[index][property]),
      `Expected ${property} in descending order`
    );
  }
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
