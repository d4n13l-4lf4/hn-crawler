import { AppliedFilters } from '@/domain/vo/applied-filters.vo';

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class Usage {
  constructor(
    readonly request_id: string,
    readonly request_timestamp: number,
    readonly applied_filters: AppliedFilters,
    readonly duration_ms: number
  ) {
    if (!UUID_V7.test(request_id)) {
      throw new Error('request_id must be a UUIDv7.');
    }
    if (!Number.isSafeInteger(request_timestamp) || request_timestamp < 0) {
      throw new Error('request_timestamp must be a non-negative integer.');
    }
    if (!(applied_filters instanceof AppliedFilters)) {
      throw new Error('applied_filters must be an AppliedFilters value.');
    }
    if (!Number.isSafeInteger(duration_ms) || duration_ms < 0) {
      throw new Error('duration_ms must be a non-negative integer.');
    }
  }
}
