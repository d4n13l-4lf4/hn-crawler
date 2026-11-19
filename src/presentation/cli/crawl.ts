import { Command } from 'commander';
import { CrawlerPort } from '@/application/ports/in/crawler.port';
import type { TitleWordRule } from '@/domain/policies/entry-filter.policy';
import { config } from '@/config/config';

const CRAWL_ERROR =
  'An error occurred while running the crawler. Please try again.';
const MAX_TITLE_WORDS_ERROR =
  'The maximum value for the title words filter is 10000. Please use a value between 1 and 10000 (e.g., gt:100).';

export function createCrawlCommand(
  crawler: CrawlerPort,
  betaEnabled = process.env.HN_CRAWLER_BETA === 'true'
): Command {
  const command = new Command('crawl').description(
    'Crawl the top Hacker News stories'
  );

  command
    .option('--top-comments', 'Sort by number of comments descending')
    .option('--top-points', 'Sort by points descending')
    .option(
      '--title-words <rule>',
      'Filter by title word count (gt:N or le:N)'
    );

  if (betaEnabled) {
    command.option('--url <url>', 'URL of the page to crawl');
  }

  command.action(
    async (options: {
      topComments?: boolean;
      topPoints?: boolean;
      titleWords?: string;
      url?: string;
    }) => {
      try {
        if (options.topComments && options.topPoints) {
          throw new CliArgumentError(
            'The --top-comments and --top-points options cannot be used together.'
          );
        }

        const titleWords = parseTitleWords(options.titleWords);
        const entries = await crawler.execute({
          url: options.url ?? config.newsCombinatorUrl,
          sortBy: options.topPoints
            ? 'points'
            : options.topComments
              ? 'comments'
              : undefined,
          titleWords,
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
      } catch (error) {
        if (error instanceof CliArgumentError) {
          console.error(error.message);
          process.exitCode = 1;
          return;
        }
        console.error(CRAWL_ERROR);
        process.exitCode = 1;
      }
    }
  );

  return command;
}

class CliArgumentError extends Error {}

function parseTitleWords(value?: string): TitleWordRule | undefined {
  if (value === undefined) return undefined;

  const match = /^(gt|le):(\d+)$/.exec(value);
  if (!match) {
    throw new CliArgumentError(`Invalid title words filter: ${value}`);
  }

  const operator = match[1] as TitleWordRule['operator'];
  const limit = Number(match[2]);
  if (limit > 10000) throw new CliArgumentError(MAX_TITLE_WORDS_ERROR);
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new CliArgumentError(`Invalid title words filter: ${value}`);
  }

  return { operator, value: limit };
}
