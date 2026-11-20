import { load, Cheerio, CheerioAPI } from 'cheerio';
import { HNEntry } from '@/domain/entities/hn-entry.entity';

const POINTS_MATCHER = /(\d+)\s+points?/i;
const COMMENTS_MATCHER = /(\d+)\s+comments?/i;

export class HnCrawlerParser {
  private readonly $: CheerioAPI;

  constructor(private readonly html: string) {
    this.$ = load(html);
  }

  hasEntries(): boolean {
    return this.$('tr.athing.submission').length > 0;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<HNEntry> {
    const storyRows = this.$('tr.athing.submission').toArray();

    if (storyRows.length === 0) {
      return;
    }

    for (let index = 0; index < storyRows.length; index += 1) {
      const row = storyRows[index];
      const story = this.$(row);
      const followingRow = story.next('tr');

      yield new HNEntry(
        this.getRank(index),
        this.getTitle(story),
        this.getPoints(followingRow),
        this.getComments(followingRow)
      );
    }
  }

  private getRank(index: number): number {
    return index + 1;
  }

  private getTitle(story: Cheerio<any>): string {
    return story.find('span.titleline > a').first().text();
  }

  private getPoints(followingRow: Cheerio<any>): string {
    const scoreText = followingRow.find('.score').first().text();
    return POINTS_MATCHER.exec(scoreText)?.[1] ?? '';
  }

  private getComments(followingRow: Cheerio<any>): string {
    const commentText = followingRow
      .find('a[href^="item?id="]')
      .filter((_, link: any) => COMMENTS_MATCHER.test(this.$(link).text()))
      .last()
      .text();
    return COMMENTS_MATCHER.exec(commentText)?.[1] ?? '';
  }
}
