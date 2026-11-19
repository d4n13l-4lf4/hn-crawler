import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const packageJsonPath = resolve(dirname(__dirname), '../../package.json');
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  version: string;
};

export function createCli(commands: Command[]): Command {
  const program = new Command();
  program
    .name('hn-crawler')
    .description('A CLI tool to scrape and analyze Hacker News entries')
    .version(version);

  for (const command of commands) {
    program.addCommand(command);
  }

  return program;
}
