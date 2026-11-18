#!/usr/bin/env node

import { CrawlerUseCase } from '@/application/usecases/crawler.usecase';
import { TrackedCrawlerUseCase } from '@/application/usecases/decorators/tracked-crawler.usecase';
import { pipelineFactory } from '@/application/pipeline/factory/factory';
import { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';
import { InMemoryUsageRepository } from '@/infrastructure/persistence/in-memory/in-memory.repository';
import { createCli } from '@/presentation/cli/cli';
import { createCrawlCommand } from '@/presentation/cli/crawl';
import { createUsageCommand } from '@/presentation/cli/usage';

const entrySource = new HnWebAdapter();
const usageRepository = new InMemoryUsageRepository();
const crawler = new CrawlerUseCase(entrySource, pipelineFactory);
const trackedCrawler = new TrackedCrawlerUseCase(crawler, usageRepository);

const cli = createCli([
  createCrawlCommand(trackedCrawler),
  createUsageCommand(usageRepository),
]);
cli.parse(process.argv);
