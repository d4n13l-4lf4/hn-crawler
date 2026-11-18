import { load } from 'cheerio';
import { HNEntry } from '@/domain/entities/hn-entry.entity';

export async function* parseHnEntries(html: string): AsyncGenerator<HNEntry> {
  const $ = load(html);
  const storyRows = $('tr.athing.submission').toArray();

  for (let index = 0; index < storyRows.length; index += 1) {
    const row = storyRows[index];
    const story = $(row);
    const followingRow = story.next('tr');
    const title = normalizeText(
      story.find('span.titleline > a').first().text()
    );
    const scoreText = followingRow.find('.score').first().text();
    const commentText = followingRow
      .find('a[href^="item?id="]')
      .filter((_, link) => /\d+\s+comments?/.test($(link).text()))
      .last()
      .text();

    yield new HNEntry(
      index + 1,
      title,
      parseInteger(scoreText),
      parseInteger(commentText)
    );
  }
}

function parseInteger(text: string): number {
  const match = text.match(/\d+(?=\s*(?:points?|comments?)\b)/i);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
