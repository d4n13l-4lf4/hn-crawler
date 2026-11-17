#!/usr/bin/env node

// Composition root for the Hacker News Crawler

import { createCli } from './cli';
import { CrawlHnUseCase } from '../application/crawl-hn.use-case';
import { HnWebAdapter } from '../infrastructure/web/hn-web.adapter';
import { SqliteUsageRepo } from '../infrastructure/persistence/sqlite-usage.repo';
import { HnHttpClient } from '../infrastructure/web/hn-http.client';
import { HnCheerioParser } from '../infrastructure/web/hn-cheerio.parser';

// Create dependencies
const httpClient = new HnHttpClient();
const parser = new HnCheerioParser();
const entrySource = new HnWebAdapter(httpClient, parser);
const usageRepo = new SqliteUsageRepo();
const useCase = new CrawlHnUseCase(entrySource, usageRepo);

// Create and execute CLI
const cli = createCli(useCase);
cli.parse(process.argv);
