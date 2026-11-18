import { describe, expect, it } from 'vitest';
import { createConfig } from '@/config/config';

describe('Config unit test', () => {
  it.each([
    {
      should: 'use the default usage retention limit',
      environment: {},
      expected: 100,
    },
    {
      should: 'use a configured usage retention limit',
      environment: { HN_CRAWLER_USAGE_LIMIT: '7' },
      expected: 7,
    },
  ])(
    'should $should when loading configuration',
    ({ environment, expected }) => {
      expect(createConfig(environment).usageRetentionLimit).toBe(expected);
    }
  );

  it('should reject an invalid usage retention limit when loading configuration', () => {
    expect(() => createConfig({ HN_CRAWLER_USAGE_LIMIT: '0' })).toThrow(
      'HN_CRAWLER_USAGE_LIMIT must be a positive integer.'
    );
  });

  it('should preserve the configured test database path when supplied', () => {
    expect(
      createConfig({ HN_CRAWLER_TEST_DB_PATH: '/tmp/usage.sqlite' })
        .usageDatabasePath
    ).toBe('/tmp/usage.sqlite');
  });
});
