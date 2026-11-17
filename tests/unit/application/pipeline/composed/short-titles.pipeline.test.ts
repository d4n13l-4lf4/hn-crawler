import { describe, expect, it } from 'vitest';
import type { HnEntry } from '../../../../../src/domain/models';
import { shortTitlesPipeline } from '../../../../../src/application/pipeline/composed/short-titles.pipeline';

describe('shortTitlesPipeline', () => {
  it('returns the input entries unchanged until the pipeline is implemented', () => {
    const entries: HnEntry[] = [];
    expect(shortTitlesPipeline(entries)).toBe(entries);
  });
});
