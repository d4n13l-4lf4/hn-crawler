import { describe, expect, it, vi } from 'vitest';
import { HnCheerioParser } from '../../../../src/infrastructure/web/hn-cheerio.parser';
import { HnHttpClient } from '../../../../src/infrastructure/web/hn-http.client';
import { HnWebAdapter } from '../../../../src/infrastructure/web/hn-web.adapter';

describe('HnWebAdapter', () => {
  it('returns no entries in the scaffolding implementation', async () => {
    const httpClient = { fetchEntries: vi.fn() } as unknown as HnHttpClient;
    const parser = { parseEntries: vi.fn() } as unknown as HnCheerioParser;
    const adapter = new HnWebAdapter(httpClient, parser);

    await expect(adapter.fetchEntries()).resolves.toEqual([]);
    expect(httpClient.fetchEntries).not.toHaveBeenCalled();
    expect(parser.parseEntries).not.toHaveBeenCalled();
  });
});
