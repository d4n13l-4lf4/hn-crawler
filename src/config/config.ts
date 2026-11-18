export function createConfig(environment: NodeJS.ProcessEnv = process.env) {
  const usageRetentionLimit = Number(environment.HN_CRAWLER_USAGE_LIMIT ?? 100);

  if (!Number.isSafeInteger(usageRetentionLimit) || usageRetentionLimit < 1) {
    throw new Error('HN_CRAWLER_USAGE_LIMIT must be a positive integer.');
  }

  return {
    newsCombinatorUrl: 'https://news.ycombinator.com/',
    usageRetentionLimit,
    usageDatabasePath: environment.HN_CRAWLER_DB_PATH?.trim() || undefined,
  };
}

export const config = createConfig();
