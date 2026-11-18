import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

type EnvPaths = (name: string) => { data: string };

let envPathsPromise: Promise<EnvPaths> | undefined;

async function getEnvPaths(): Promise<EnvPaths> {
  envPathsPromise ??= import('env-paths').then((module) => module.default);
  return envPathsPromise;
}

export async function getSqlitePath(overridePath?: string): Promise<string> {
  const explicitPath = overridePath?.trim();
  const databasePath = explicitPath
    ? explicitPath
    : join((await getEnvPaths())('hn-crawler').data, 'usage.sqlite');

  mkdirSync(dirname(databasePath), { recursive: true });

  return databasePath;
}
