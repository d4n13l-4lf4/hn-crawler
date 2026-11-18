import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

type EnvPaths = (name: string) => { data: string };

let envPathsPromise: Promise<EnvPaths> | undefined;

async function getEnvPaths(): Promise<EnvPaths> {
  envPathsPromise ??= import('env-paths').then((module) => module.default);
  return envPathsPromise;
}

export async function getSqlitePath(overridePath?: string): Promise<string> {
  const envPaths = overridePath ? undefined : await getEnvPaths();
  const databasePath =
    overridePath ?? join(envPaths!('hn-crawler').data, 'usage.sqlite');

  mkdirSync(dirname(databasePath), { recursive: true });

  return databasePath;
}
