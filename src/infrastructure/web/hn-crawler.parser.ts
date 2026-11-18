import { load } from 'cheerio';
import { HNEntry } from '@/domain/entities/hn-entry.entity';

const POINTS_MATCHER = /(\d+)\s+points?/i;
const COMMENTS_MATCHER = /(\d+)\s+comments?/i;

export async function* parseHnEntries(html: string): AsyncGenerator<HNEntry> {
  const $ = load(html);
  const storyRows = $('tr.athing.submission').toArray();

  for (let index = 0; index < storyRows.length; index += 1) {
    const row = storyRows[index];
    const story = $(row);
    const followingRow = story.next('tr');
    const title = story.find('span.titleline > a').first().text();
    const scoreText = followingRow.find('.score').first().text();
    const commentText = followingRow
      .find('a[href^="item?id="]')
      .filter((_, link) => COMMENTS_MATCHER.test($(link).text()))
      .last()
      .text();

    yield new HNEntry(
      index + 1,
      title,
      POINTS_MATCHER.exec(scoreText)?.[1] ?? '',
      COMMENTS_MATCHER.exec(commentText)?.[1] ?? ''
    );
  }
}
