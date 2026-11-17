import { describe, expect, it } from 'vitest';
import { SqliteUsageRepo } from '../../../../src/infrastructure/persistence/sqlite-usage.repo';

describe('SqliteUsageRepo', () => {
  it('resolves in the scaffolding implementation', async () => {
    await expect(
      new SqliteUsageRepo().storeUsage('crawl-hn', 12)
    ).resolves.toBeUndefined();
  });
});
