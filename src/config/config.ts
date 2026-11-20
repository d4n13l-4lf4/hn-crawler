export function createConfig(environment: NodeJS.ProcessEnv = process.env) {
  const usageRetentionLimit = Number(environment.HN_CRAWLER_USAGE_LIMIT ?? 100);

  if (!Number.isSafeInteger(usageRetentionLimit) || usageRetentionLimit < 1) {
    throw new Error('HN_CRAWLER_USAGE_LIMIT must be a positive integer.');
  }

  const httpTimeout = Number(environment.HN_CRAWLER_HTTP_TIMEOUT ?? 15000);
  const httpMaxRetries = Number(environment.HN_CRAWLER_HTTP_MAX_RETRIES ?? 3);
  const httpRetryDelay = Number(
    environment.HN_CRAWLER_HTTP_RETRY_DELAY ?? 3000
  );

  const maxEntriesToFetch = Number(
    environment.HN_CRAWLER_MAX_ENTRIES_TO_FETCH ?? 30
  );
  const maxPagesToFetch = Number(
    environment.HN_CRAWLER_MAX_PAGES_TO_FETCH ?? 10
  );

  if (!Number.isSafeInteger(httpTimeout) || httpTimeout < 1) {
    throw new Error('HN_CRAWLER_HTTP_TIMEOUT must be a positive integer.');
  }
  if (!Number.isSafeInteger(httpMaxRetries) || httpMaxRetries < 0) {
    throw new Error(
      'HN_CRAWLER_HTTP_MAX_RETRIES must be a non-negative integer.'
    );
  }
  if (!Number.isSafeInteger(httpRetryDelay) || httpRetryDelay < 0) {
    throw new Error(
      'HN_CRAWLER_HTTP_RETRY_DELAY must be a non-negative integer.'
    );
  }
  if (!Number.isSafeInteger(maxEntriesToFetch) || maxEntriesToFetch < 1) {
    throw new Error(
      'HN_CRAWLER_MAX_ENTRIES_TO_FETCH must be a positive integer.'
    );
  }
  if (!Number.isSafeInteger(maxPagesToFetch) || maxPagesToFetch < 1) {
    throw new Error(
      'HN_CRAWLER_MAX_PAGES_TO_FETCH must be a positive integer.'
    );
  }

  return {
    newsCombinatorUrl:
      environment.HN_CRAWLER_WEB_PAGE_BASE_URL?.trim() ||
      'https://news.ycombinator.com/',
    httpTimeout,
    httpMaxRetries,
    httpRetryDelay,
    maxEntriesToFetch,
    maxPagesToFetch,
    usageRetentionLimit,
    usageDatabasePath: environment.HN_CRAWLER_DB_PATH?.trim() || undefined,
  };
}

export const config = createConfig();
