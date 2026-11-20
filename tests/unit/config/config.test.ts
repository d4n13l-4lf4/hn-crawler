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
      should: 'use the default max entries to fetch',
      environment: {},
      expected: 30,
    },
    {
      should: 'use a configured max entries to fetch',
      environment: { HN_CRAWLER_MAX_ENTRIES_TO_FETCH: '7' },
      expected: 7,
    },
  ])(
    'should $should when loading configuration',
    ({ environment, expected }) => {
      expect(createConfig(environment).maxEntriesToFetch).toBe(expected);
    }
  );

  it('should reject an invalid max entries to fetch when loading configuration', () => {
    expect(() =>
      createConfig({ HN_CRAWLER_MAX_ENTRIES_TO_FETCH: '0' })
    ).toThrow('HN_CRAWLER_MAX_ENTRIES_TO_FETCH must be a positive integer.');
  });

  it.each([
    {
      should: 'use the default max pages to fetch',
      environment: {},
      expected: 10,
    },
    {
      should: 'use a configured max pages to fetch',
      environment: { HN_CRAWLER_MAX_PAGES_TO_FETCH: '5' },
      expected: 5,
    },
  ])(
    'should $should when loading configuration',
    ({ environment, expected }) => {
      expect(createConfig(environment).maxPagesToFetch).toBe(expected);
    }
  );

  it('should reject an invalid max pages to fetch when loading configuration', () => {
    expect(() => createConfig({ HN_CRAWLER_MAX_PAGES_TO_FETCH: '0' })).toThrow(
      'HN_CRAWLER_MAX_PAGES_TO_FETCH must be a positive integer.'
    );
  });

  it.each([
    {
      should: 'use the default http timeout',
      environment: {},
      expected: 15000,
    },
    {
      should: 'use a configured http timeout',
      environment: { HN_CRAWLER_HTTP_TIMEOUT: '30000' },
      expected: 30000,
    },
  ])(
    'should $should when loading configuration',
    ({ environment, expected }) => {
      expect(createConfig(environment).httpTimeout).toBe(expected);
    }
  );

  it('should reject an invalid http timeout when loading configuration', () => {
    expect(() => createConfig({ HN_CRAWLER_HTTP_TIMEOUT: '0' })).toThrow(
      'HN_CRAWLER_HTTP_TIMEOUT must be a positive integer.'
    );
  });

  it.each([
    {
      should: 'use the default http max retries',
      environment: {},
      expected: 3,
    },
    {
      should: 'use a configured http max retries',
      environment: { HN_CRAWLER_HTTP_MAX_RETRIES: '5' },
      expected: 5,
    },
  ])(
    'should $should when loading configuration',
    ({ environment, expected }) => {
      expect(createConfig(environment).httpMaxRetries).toBe(expected);
    }
  );

  it('should reject an invalid http max retries when loading configuration', () => {
    expect(() => createConfig({ HN_CRAWLER_HTTP_MAX_RETRIES: '-1' })).toThrow(
      'HN_CRAWLER_HTTP_MAX_RETRIES must be a non-negative integer.'
    );
  });

  it.each([
    {
      should: 'use the default http retry delay',
      environment: {},
      expected: 3000,
    },
    {
      should: 'use a configured http retry delay',
      environment: { HN_CRAWLER_HTTP_RETRY_DELAY: '5000' },
      expected: 5000,
    },
  ])(
    'should $should when loading configuration',
    ({ environment, expected }) => {
      expect(createConfig(environment).httpRetryDelay).toBe(expected);
    }
  );

  it('should reject an invalid http retry delay when loading configuration', () => {
    expect(() => createConfig({ HN_CRAWLER_HTTP_RETRY_DELAY: '-1' })).toThrow(
      'HN_CRAWLER_HTTP_RETRY_DELAY must be a non-negative integer.'
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
