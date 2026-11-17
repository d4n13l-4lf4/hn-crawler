import { describe, expect, it } from 'vitest';
import type { HnEntry } from '../../../../../src/domain/models';
import { topByCommentsStep } from '../../../../../src/application/pipeline/steps/top-by-comments.step';

describe('topByCommentsStep', () => {
  it('returns the input entries unchanged until sorting is implemented', () => {
    const entries: HnEntry[] = [];
    expect(topByCommentsStep(entries)).toBe(entries);
  });
});
