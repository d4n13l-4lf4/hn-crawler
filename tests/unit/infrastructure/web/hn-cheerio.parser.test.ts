import { describe, expect, it } from 'vitest';
import { HnCheerioParser } from '../../../../src/infrastructure/web/hn-cheerio.parser';

describe('HnCheerioParser', () => {
  it('returns no entries in the scaffolding implementation', () => {
    expect(new HnCheerioParser().parseEntries('<html></html>')).toEqual([]);
  });
});
