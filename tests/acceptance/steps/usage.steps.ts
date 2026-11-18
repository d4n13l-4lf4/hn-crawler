import { Then, When } from '@cucumber/cucumber';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import assert from 'node:assert/strict';

interface CommandResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

When(
  'I run {string} as a standalone command',
  function (this: { result?: CommandResult }, command: string) {
    this.result = runCli(command.split(' ').slice(1));
  }
);

Then(
  'the usage command exits with code 0',
  function (this: { result?: CommandResult }) {
    assert.equal(
      this.result?.status,
      0,
      `Expected status 0; stderr: ${this.result?.stderr}`
    );
  }
);

Then(
  'the usage command exits with a non-zero code',
  function (this: { result?: CommandResult }) {
    assert.notEqual(
      this.result?.status,
      0,
      `Expected non-zero status; stderr: ${this.result?.stderr}`
    );
  }
);

Then(
  'the usage output is an empty JSON array',
  function (this: { result?: CommandResult }) {
    assert.deepEqual(parseOutput(this.result), []);
  }
);

Then(
  'the usage output is a JSON array',
  function (this: { result?: CommandResult }) {
    assert.ok(Array.isArray(parseOutput(this.result)));
  }
);

Then(
  'the usage output contains the required public fields',
  function (this: { result?: CommandResult }) {
    const entries = parseOutput(this.result);
    assert.ok(Array.isArray(entries));
    for (const entry of entries) {
      assert.deepEqual(Object.keys(entry).sort(), [
        'applied_filters',
        'duration_ms',
        'request_id',
        'request_timestamp',
      ]);
    }
  }
);

function runCli(args: string[]): CommandResult {
  const result: SpawnSyncReturns<string> = spawnSync('hn-crawler', args, {
    encoding: 'utf8',
    env: process.env,
    shell: false,
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

function parseOutput(result?: CommandResult): unknown {
  assert.ok(result, 'Command was not executed');
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    assert.fail(
      `Expected JSON output; got ${result.stdout}. Stderr: ${result.stderr}. Error: ${String(error)}`
    );
  }
}
