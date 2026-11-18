#!/usr/bin/env node

import { CrawlerUseCase } from '@/application/usecases/crawler.usecase';
import { pipelineFactory } from '@/application/pipeline/factory/factory';
import { HnWebAdapter } from '@/infrastructure/web/hn-web.adapter';
import { createCli } from '@/presentation/cli/cli';
import { createCrawlCommand } from '@/presentation/cli/crawl';

const entrySource = new HnWebAdapter();
const useCase = new CrawlerUseCase(entrySource, pipelineFactory);

const cli = createCli([createCrawlCommand(useCase)]);
cli.parse(process.argv);
