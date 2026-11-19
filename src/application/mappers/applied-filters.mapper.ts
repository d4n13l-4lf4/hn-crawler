import type { CrawlRequest } from '@/application/ports/in/crawler.port';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';

export function mapAppliedFilters(request: CrawlRequest): AppliedFilters {
  const builder = AppliedFilters.builder();
  if (request.sortBy) builder.sortBy(request.sortBy);
  return builder.titleWords(request.titleWords).build();
}
