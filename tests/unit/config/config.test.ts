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

  it.each([
    {
      should: 'use the explicit database path when configured',
      environment: { HN_CRAWLER_DB_PATH: '/tmp/usage.sqlite' },
      expected: '/tmp/usage.sqlite',
    },
    {
      should: 'fall back when the explicit database path is empty',
      environment: { HN_CRAWLER_DB_PATH: '' },
      expected: undefined,
    },
    {
      should: 'ignore the legacy test-only database path',
      environment: { HN_CRAWLER_TEST_DB_PATH: '/tmp/legacy.sqlite' },
      expected: undefined,
    },
  ])(
    'should $should when loading configuration',
    ({ environment, expected }) => {
      expect(createConfig(environment).usageDatabasePath).toBe(expected);
    }
  );
});
