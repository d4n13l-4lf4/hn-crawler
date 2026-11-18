import {
  After,
  Before,
  Given,
  Then,
  When,
  World,
  setWorldConstructor,
} from '@cucumber/cucumber';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

interface CommandResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

class CrawlWorld extends World {
  result?: CommandResult;
  server?: Server;
  serverUrl?: string;

  async serve(content: string, status = 200): Promise<string> {
    this.server = createServer((_request, response) => {
      response.statusCode = status;
      response.end(content);
    });
    await new Promise<void>((resolve) =>
      this.server?.listen(0, '127.0.0.1', resolve)
    );
    const address = this.server.address() as AddressInfo;
    this.serverUrl = `http://127.0.0.1:${address.port}`;
    return this.serverUrl;
  }

  async close(): Promise<void> {
    if (!this.server?.listening) return;
    await new Promise<void>((resolve, reject) =>
      this.server?.close((error) => (error ? reject(error) : resolve()))
    );
    this.server = undefined;
  }
}

setWorldConstructor(CrawlWorld);

Before(function (this: CrawlWorld) {
  this.result = undefined;
});

After(async function (this: CrawlWorld) {
  await this.close();
});

Given(
  'the local Hacker News page is available as a crawl source',
  async function (this: CrawlWorld) {
    const html = readFileSync(
      join(process.cwd(), 'tests/resources/hacker-news.html'),
      'utf8'
    );
    await this.serve(html);
  }
);

Given(
  'a local page with 2 Hacker News story entries is available',
  async function (this: CrawlWorld) {
    await this.serve(
      '<tr class="athing submission"><td class="title"><span class="titleline"><a>First</a></span></td></tr><tr class="athing submission"><td class="title"><span class="titleline"><a>Second</a></span></td></tr>'
    );
  }
);

Given(
  'a local page with no Hacker News story entries is available',
  async function (this: CrawlWorld) {
    await this.serve('<html><body><p>No stories</p></body></html>');
  }
);

Given(
  'the local crawl source returns an HTTP error',
  async function (this: CrawlWorld) {
    await this.serve('Unavailable', 503);
  }
);

When(
  'I run the crawl command with the local page URL in beta mode',
  function (this: CrawlWorld) {
    assert.ok(this.serverUrl, 'Local source server has not been started');
    this.result = runCli(['crawl', '--url', this.serverUrl], {
      HN_CRAWLER_BETA: 'true',
    });
  }
);

When(
  'I run {string} in production mode',
  function (this: CrawlWorld, command: string) {
    this.result = runCli(command.split(' ').slice(1), {
      HN_CRAWLER_BETA: '',
    });
  }
);

Then(
  'the crawl output is a JSON array with {int} entries in page order',
  function (this: CrawlWorld, count: number) {
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
    this: CrawlWorld,
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

Then('the crawl output is an empty JSON array', function (this: CrawlWorld) {
  assert.deepEqual(parseOutput(this.result).stdout, []);
});

Then(
  'the first entry title is {string}',
  function (this: CrawlWorld, title: string) {
    assert.equal(parseOutput(this.result).stdout[0]?.title, title);
  }
);

Then(
  'I should see {string} in the error output',
  function (this: CrawlWorld, expected: string) {
    assert.ok(
      this.result?.stderr.includes(expected),
      `Expected stderr to include ${JSON.stringify(expected)}, got ${this.result?.stderr}`
    );
  }
);

Then(
  'I should see the standard CLI usage error in the error output',
  function (this: CrawlWorld) {
    assert.ok(
      this.result?.stderr.includes('error: unknown option'),
      `Expected a standard unknown-option error, got ${this.result?.stderr}`
    );
  }
);

Then(
  'I should not see {string} in the output',
  function (this: CrawlWorld, unexpected: string) {
    assert.ok(
      !`${this.result?.stdout}\n${this.result?.stderr}`.includes(unexpected)
    );
  }
);

Then('the crawl exit code should be 0', function (this: CrawlWorld) {
  assert.equal(
    this.result?.status,
    0,
    `Expected status 0, got ${this.result?.status}; stderr: ${this.result?.stderr}`
  );
});

Then('the crawl exit code should be non-zero', function (this: CrawlWorld) {
  assert.notEqual(
    this.result?.status,
    0,
    `Expected non-zero status; stdout: ${this.result?.stdout}; stderr: ${this.result?.stderr}`
  );
});

function runCli(args: string[], env: Record<string, string>): CommandResult {
  const binary =
    process.env.HN_CRAWLER_BIN ??
    join(process.cwd(), 'dist/presentation/main.js');
  const result: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    [binary, ...args],
    {
      encoding: 'utf8',
      env: { ...process.env, HN_CRAWLER_BETA: env.HN_CRAWLER_BETA },
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
