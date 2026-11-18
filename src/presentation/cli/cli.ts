import { Command } from 'commander';

export function createCli(commands: Command[]): Command {
  const program = new Command();
  program
    .name('hn-crawler')
    .description('A CLI tool to scrape and analyze Hacker News entries')
    .version('1.0.0');

  for (const command of commands) {
    program.addCommand(command);
  }

  return program;
}
