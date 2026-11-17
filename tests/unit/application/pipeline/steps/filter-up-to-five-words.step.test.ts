import { describe, expect, it } from 'vitest';
import type { HnEntry } from '../../../../../src/domain/models';
import { filterUpToFiveWordsStep } from '../../../../../src/application/pipeline/steps/filter-up-to-five-words.step';

describe('filterUpToFiveWordsStep', () => {
  it('returns the input entries unchanged until the filter is implemented', () => {
    const entries: HnEntry[] = [];
    expect(filterUpToFiveWordsStep(entries)).toBe(entries);
  });
});
