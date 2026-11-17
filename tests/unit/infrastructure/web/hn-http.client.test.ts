import { describe, expect, it } from 'vitest';
import { HnHttpClient } from '../../../../src/infrastructure/web/hn-http.client';

describe('HnHttpClient', () => {
  it('returns no entries in the scaffolding implementation', async () => {
    await expect(new HnHttpClient().fetchEntries()).resolves.toEqual([]);
  });
});
