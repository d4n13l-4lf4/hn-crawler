import { describe, expect, it } from 'vitest';
import type { HnEntry } from '../../../../../src/domain/models';
import { filterMoreThanFiveWordsStep } from '../../../../../src/application/pipeline/steps/filter-more-than-five-words.step';

describe('filterMoreThanFiveWordsStep', () => {
  it('returns the input entries unchanged until the filter is implemented', () => {
    const entries: HnEntry[] = [];
    expect(filterMoreThanFiveWordsStep(entries)).toBe(entries);
  });
});
