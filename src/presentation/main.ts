#!/usr/bin/env node

import { CrawlerUseCase } from '../application/usecases/crawler.usecase';
import { HnWebAdapter } from '../infrastructure/web/hn-web.adapter';
import { createCli } from './cli/cli';
import { createCrawlCommand } from './cli/crawl';

const entrySource = new HnWebAdapter();
const useCase = new CrawlerUseCase(entrySource);

const cli = createCli([createCrawlCommand(useCase)]);
cli.parse(process.argv);
