// CLI command definition for Hacker News Crawler

import { Command } from 'commander';
import { CrawlerPort } from '../application/ports/in/crawler.port';

export function createCli(_useCase: CrawlerPort): Command {
  const program = new Command();

  program
    .name('hn-crawler')
    .description('A CLI tool to scrape and analyze Hacker News entries')
    .version('1.0.0')
    .action(async () => {
      // Default action - print "Hello World" for MVP
      console.log('Hello World');
    });

  return program;
}
