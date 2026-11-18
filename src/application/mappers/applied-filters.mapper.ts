import type { CrawlRequest } from '@/application/ports/in/crawler.port';
import { AppliedFilters } from '@/domain/vo/applied-filters.vo';

export function mapAppliedFilters(request: CrawlRequest): AppliedFilters {
  return AppliedFilters.builder()
    .sortBy(request.sortBy)
    .titleWords(request.titleWords)
    .build();
}
