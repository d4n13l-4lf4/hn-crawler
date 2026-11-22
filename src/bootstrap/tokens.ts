import type { createConfig } from '@/config/config';

export type Config = ReturnType<typeof createConfig>;

export const Config: unique symbol = Symbol('Config');
export const EntrySource: unique symbol = Symbol('EntrySource');
export const HttpClient: unique symbol = Symbol('HttpClient');
export const AxiosInstance: unique symbol = Symbol('AxiosInstance');
export const SqliteClient: unique symbol = Symbol('SqliteClient');
export const UsageRepository: unique symbol = Symbol('UsageRepository');
export const CrawlerUseCase: unique symbol = Symbol('CrawlerUseCase');
export const TrackedCrawlerUseCase: unique symbol = Symbol(
  'TrackedCrawlerUseCase'
);
export const UsageQueryUseCase: unique symbol = Symbol('UsageQueryUseCase');
export const PipelineFactory: unique symbol = Symbol('PipelineFactory');
export const SqliteMigrator: unique symbol = Symbol('SqliteMigrator');
export const SqlitePathResolver: unique symbol = Symbol('SqlitePathResolver');
