// Binding map: documents which container token resolves to which concrete type,
// and at what scope. All bindings are singletons.
//
// This file is type-level documentation only; runtime assembly happens in
// container.ts via createContainer().

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
import type { createConfig } from '@/config/config';
import type { HnHttpClient } from '@/infrastructure/web/hn-http.client';
import type { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';
import type { CrawlerUseCase } from '@/application/usecases/crawler.usecase';
import type { TrackedCrawlerUseCase } from '@/application/usecases/decorators/tracked-crawler.usecase';
import type { UsageQueryUseCase } from '@/application/usecases/usage-query.usecase';
import type { SqliteUsageRepository } from '@/infrastructure/persistence/sqlite/repositories/usage.repository';
import { pipelineFactory } from '@/application/pipeline/factory/factory';
import { migrateSqlite } from '@/infrastructure/persistence/sqlite/sqlite-migrator';
import { getSqlitePath } from '@/infrastructure/persistence/sqlite/sqlite-path';
import { createAxiosHttpClient } from '@/infrastructure/web/axios';
import { createSqliteClient } from '@/infrastructure/persistence/sqlite/sqlite.client';

export type BindingConfig = ReturnType<typeof createConfig>;
export type BindingEntrySource = HnWebAdapter; // implements EntrySourcePort
export type BindingHttpClient = HnHttpClient;
export type BindingAxiosInstance = ReturnType<typeof createAxiosHttpClient>;
export type BindingSqliteClient = ReturnType<typeof createSqliteClient>;
export type BindingUsageRepository = SqliteUsageRepository; // implements UsageRepositoryPort
export type BindingCrawlerUseCase = CrawlerUseCase; // implements CrawlerPort
export type BindingTrackedCrawlerUseCase = TrackedCrawlerUseCase; // implements CrawlerPort
export type BindingUsageQueryUseCase = UsageQueryUseCase; // implements UsageQueryPort
export type BindingPipelineFactory = typeof pipelineFactory;
export type BindingSqliteMigrator = typeof migrateSqlite;
export type BindingSqlitePathResolver = typeof getSqlitePath;

/**
 * ContainerBindings maps each container token symbol to its resolved container type.
 * Used to type `TypedContainer<ContainerBindings>` so that `container.get()`
 * and `container.bind()` are fully type-checked against the binding map,
 * eliminating the need for inline `as` casts in container.ts.
 */
export type ContainerBindings = {
  [Config]: BindingConfig;
  [EntrySource]: BindingEntrySource;
  [HttpClient]: BindingHttpClient;
  [AxiosInstance]: BindingAxiosInstance;
  [SqliteClient]: BindingSqliteClient;
  [UsageRepository]: BindingUsageRepository;
  [CrawlerUseCaseToken]: BindingCrawlerUseCase;
  [TrackedCrawlerUseCaseToken]: BindingTrackedCrawlerUseCase;
  [UsageQueryUseCaseToken]: BindingUsageQueryUseCase;
  [PipelineFactory]: BindingPipelineFactory;
  [SqliteMigrator]: BindingSqliteMigrator;
  [SqlitePathResolver]: BindingSqlitePathResolver;
};

/**
 * Binding scope: all bindings are registered as singletons (inSingletonScope).
 * The container creates each instance once and reuses it for the lifetime of
 * the application process, matching the previous manual-wiring behavior.
 */
