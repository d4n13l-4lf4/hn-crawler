// Web adapter for Hacker News integration

import { EntrySourcePort } from '../../application/ports/entry-source.port';
import { HnEntry } from '../../domain/models';
import { HnHttpClient } from './hn-http.client';
import { HnCheerioParser } from './hn-cheerio.parser';

export class HnWebAdapter implements EntrySourcePort {
  constructor(
    private readonly httpClient: HnHttpClient,
    private readonly parser: HnCheerioParser
  ) {}

  async fetchEntries(): Promise<HnEntry[]> {
    // Placeholder - will be implemented in future stories
    return [];
  }
}
