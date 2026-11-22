import { TypedContainer } from '@inversifyjs/strongly-typed';
import { config } from '@/config/config';
import { createAxiosHttpClient } from '@/infrastructure/web/axios';
import { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';
import { getSqlitePath } from '@/infrastructure/persistence/sqlite/sqlite-path';
import { migrateSqlite } from '@/infrastructure/persistence/sqlite/sqlite-migrator';
import { pipelineFactory } from '@/application/pipeline/factory/factory';
import { HnHttpClient } from '@/infrastructure/web/hn-http.client';
import { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';
import { CrawlerUseCase } from '@/application/usecases/crawler.usecase';
import { TrackedCrawlerUseCase } from '@/application/usecases/decorators/tracked-crawler.usecase';
import { UsageQueryUseCase } from '@/application/usecases/usage-query.usecase';
import { SqliteUsageRepository } from '@/infrastructure/persistence/sqlite/repositories/usage.repository';
import {
  Config,
  EntrySource,
  HttpClient,
  AxiosInstance,
  SqliteClient,
  UsageRepository,
  CrawlerUseCase as CrawlerUseCaseToken,
  TrackedCrawlerUseCase as TrackedCrawlerUseCaseToken,
  UsageQueryUseCase as UsageQueryUseCaseToken,
  PipelineFactory,
  SqliteMigrator,
  SqlitePathResolver,
} from './tokens';
import type {
  ContainerBindings,
  BindingConfig,
  BindingEntrySource,
  BindingHttpClient,
  BindingAxiosInstance,
  BindingSqliteClient,
  BindingUsageRepository,
  BindingCrawlerUseCase,
  BindingPipelineFactory,
} from './binding.map';

export function createContainer(databasePath: string) {
  const container = new TypedContainer<ContainerBindings>();

  container.bind(Config).toConstantValue(config);
  container
    .bind(SqliteClient)
    .toConstantValue(createSqliteClient(databasePath));
  container.bind(SqliteMigrator).toConstantValue(migrateSqlite);
  container.bind(SqlitePathResolver).toConstantValue(getSqlitePath);
  container.bind(PipelineFactory).toConstantValue(pipelineFactory);

  container
    .bind(AxiosInstance)
    .toDynamicValue((ctx) => {
      const cfg = ctx.get<BindingConfig>(Config);
      return createAxiosHttpClient({
        baseURL: cfg.newsCombinatorUrl,
        timeout: cfg.httpTimeout,
        maxRetries: cfg.httpMaxRetries,
        retryDelay: cfg.httpRetryDelay,
      });
    })
    .inSingletonScope();

  container
    .bind(HttpClient)
    .toDynamicValue((ctx) => {
      const axiosInstance = ctx.get<BindingAxiosInstance>(AxiosInstance);
      return new HnHttpClient(axiosInstance);
    })
    .inSingletonScope();

  container
    .bind(EntrySource)
    .toDynamicValue((ctx) => {
      const httpClient = ctx.get<BindingHttpClient>(HttpClient);
      const cfg = ctx.get<BindingConfig>(Config);
      return new HnWebAdapter(httpClient, cfg.maxPagesToFetch);
    })
    .inSingletonScope();

  container
    .bind(UsageRepository)
    .toDynamicValue((ctx) => {
      const database = ctx.get<BindingSqliteClient>(SqliteClient);
      const cfg = ctx.get<BindingConfig>(Config);
      return new SqliteUsageRepository(database, cfg.usageRetentionLimit);
    })
    .inSingletonScope();

  container
    .bind(CrawlerUseCaseToken)
    .toDynamicValue((ctx) => {
      const entrySource = ctx.get<BindingEntrySource>(EntrySource);
      const pf = ctx.get<BindingPipelineFactory>(PipelineFactory);
      return new CrawlerUseCase(entrySource, pf);
    })
    .inSingletonScope();

  container
    .bind(TrackedCrawlerUseCaseToken)
    .toDynamicValue((ctx) => {
      const crawler = ctx.get<BindingCrawlerUseCase>(CrawlerUseCaseToken);
      const usageRepository = ctx.get<BindingUsageRepository>(UsageRepository);
      return new TrackedCrawlerUseCase(crawler, usageRepository);
    })
    .inSingletonScope();

  container
    .bind(UsageQueryUseCaseToken)
    .toDynamicValue((ctx) => {
      const usageRepository = ctx.get<BindingUsageRepository>(UsageRepository);
      return new UsageQueryUseCase(usageRepository);
    })
    .inSingletonScope();

  return container;
}
