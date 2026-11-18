import { Command } from 'commander';
import { CrawlerPort } from '@/application/ports/in/crawler.port';
import { config } from '@/config/config';

const CRAWL_ERROR =
  'An error occurred while running the crawler. Please try again.';

export function createCrawlCommand(
  crawler: CrawlerPort,
  betaEnabled = process.env.HN_CRAWLER_BETA === 'true'
): Command {
  const command = new Command('crawl').description(
    'Crawl the top Hacker News stories'
  );

  if (betaEnabled) {
    command.option('--url <url>', 'URL of the page to crawl');
  }

  command.action(async (options: { url?: string }) => {
    try {
      const entries = await crawler.execute({
        url: options.url ?? config.newsCombinatorUrl,
        sortBy: 'comments',
        titleWords: { operator: 'gt', value: 5 },
      });
      console.log(
        JSON.stringify(
          entries.map(({ rank, title, points, number_of_comments }) => ({
            rank: rank.value,
            title: title.value,
            points: points.value,
            number_of_comments: number_of_comments.value,
          })),
          null,
          2
        )
      );
    } catch {
      console.error(CRAWL_ERROR);
      process.exit(1);
    }
  });

  return command;
}
