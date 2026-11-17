import { describe, expect, it } from 'vitest';
import type { HnEntry } from '../../../../../src/domain/models';
import { longTitlesPipeline } from '../../../../../src/application/pipeline/composed/long-titles.pipeline';

describe('longTitlesPipeline', () => {
  it('returns the input entries unchanged until the pipeline is implemented', () => {
    const entries: HnEntry[] = [];
    expect(longTitlesPipeline(entries)).toBe(entries);
  });
});
