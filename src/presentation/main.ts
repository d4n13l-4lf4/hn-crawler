#!/usr/bin/env node

import { CrawlerUseCase } from '../application/usecases/crawler.usecase';
import { createCli } from './cli';

const useCase = new CrawlerUseCase({
  async *fetchEntries() {
    // The web adapter is added in the next implementation milestone.
  },
});

const cli = createCli(useCase);
cli.parse(process.argv);
