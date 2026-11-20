import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HnCrawlerParser } from '@/infrastructure/web/hn-crawler.parser';
import { HNEntry } from '@/domain/entities/hn-entry.entity';

const sampleHtml = readFileSync(
  resolve(process.cwd(), 'tests/resources/hacker-news.html'),
  'utf8'
);

type ParserTestCase = {
  should: string;
  when: string;
  input: string;
  expected: HNEntry[];
};

describe('Hacker News parser unit test', () => {
  const testCases: ParserTestCase[] = [
    {
      should: 'parse the first entry with its title, points, and comments',
      when: 'the page contains the Hacker News example resource',
      input: sampleHtml,
      expected: [
        new HNEntry(
          1,
          'Java4Shell: RCE in OpenJDK when processing Base64',
          795,
          211
        ),
      ],
    },
    {
      should: 'use empty title and zero counts when entry text is missing',
      when: 'a story row has no readable title or metadata',
      input:
        '<table><tr class="athing submission"><td class="title"></td></tr></table>',
      expected: [new HNEntry(1, '', 0, 0)],
    },
    {
      should: 'use zero counts when integer values cannot be parsed',
      when: 'score and comments metadata contain no digit sequences',
      input:
        '<table><tr class="athing submission"><td class="title"><span class="titleline"><a>Story</a></span></td></tr><tr><td class="subtext"><span class="score">many points</span><a href="item?id=1">many comments</a></td></tr></table>',
      expected: [new HNEntry(1, 'Story', 0, 0)],
    },
    {
      should: 'return no entries when the page has no story rows',
      when: 'the page contains no story rows',
      input: '<html><body><p>No stories</p></body></html>',
      expected: [],
    },
  ];

  it.each(testCases)(
    'should $should when $when',
    async ({ input, expected }) => {
      const parser = new HnCrawlerParser(input);
      const result: HNEntry[] = [];
      for await (const entry of parser) result.push(entry);
      expect(result.slice(0, expected.length)).toEqual(expected);
    }
  );

  it('should yield all sample entries in source order with one-based ranks', async () => {
    const parser = new HnCrawlerParser(sampleHtml);
    const result: HNEntry[] = [];
    for await (const entry of parser) result.push(entry);

    expect(result).toHaveLength(30);
    expect(result.map((entry) => entry.rank.value)).toEqual(
      Array.from({ length: 30 }, (_, index) => index + 1)
    );
  });

  it('should default missing score and discussion counts in the sample to zero', async () => {
    const parser = new HnCrawlerParser(sampleHtml);
    const result: HNEntry[] = [];
    for await (const entry of parser) result.push(entry);

    expect(result[13]).toEqual(
      new HNEntry(
        14,
        'GoGoGrandparent (YC S16) Is a Front End JavaScript / TypeScript Engineer',
        0,
        0
      )
    );
    expect(result[26]).toEqual(
      new HNEntry(
        27,
        "Show HN: Unref – A Python dead code finder built on Ruff's parser",
        10,
        0
      )
    );
  });

  it('should report hasEntries true when the page contains story rows', () => {
    const parser = new HnCrawlerParser(sampleHtml);
    expect(parser.hasEntries()).toBe(true);
  });

  it('should report hasEntries false when the page has no story rows', () => {
    const parser = new HnCrawlerParser(
      '<html><body><p>No stories</p></body></html>'
    );
    expect(parser.hasEntries()).toBe(false);
  });

  it('should be async iterable', () => {
    const parser = new HnCrawlerParser(sampleHtml);
    expect(typeof parser[Symbol.asyncIterator]).toBe('function');
  });

  it('should terminate the async iterator when no entries exist', async () => {
    const parser = new HnCrawlerParser(
      '<html><body><p>No stories</p></body></html>'
    );
    const result: HNEntry[] = [];
    for await (const entry of parser) result.push(entry);
    expect(result).toEqual([]);
  });
});
