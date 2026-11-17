import { Given, When, Then } from '@cucumber/cucumber';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import * as assert from 'assert';

interface CliWorld {
  result?: SpawnSyncReturns<string>;
}

Given('I have installed the hn-crawler CLI', function (this: CliWorld) {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const check = spawnSync(checkCmd, ['hn-crawler'], { encoding: 'utf8' });

  assert.strictEqual(
    check.status,
    0,
    'Expected "hn-crawler" to be globally installed and available in PATH. Run "npm install -g ." first.'
  );
});

When('I run "hn-crawler" with no arguments', function (this: CliWorld) {
  this.result = spawnSync('hn-crawler', [], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
});

When(
  'I run {string} with {string}',
  function (this: CliWorld, command: string, argument: string) {
    this.result = spawnSync(command, [argument], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
  }
);

Then(
  'I should see {string} in the output',
  function (this: CliWorld, expectedOutput: string) {
    assert.ok(this.result, 'Command was not executed');
    assert.ok(
      this.result.stdout?.includes(expectedOutput),
      `Expected output to include ${JSON.stringify(expectedOutput)}, got ${this.result.stdout}`
    );
  }
);

Then('the exit code should be 0', function (this: CliWorld) {
  assert.ok(this.result, 'Command was not executed');
  assert.strictEqual(
    this.result.status,
    0,
    `Expected exit code 0, got ${this.result.status}. Stderr: ${this.result.stderr}`
  );
});
