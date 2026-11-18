import type { TitleWordRule } from '@/domain/policies/entry-filter.policy';

type SortBy = 'comments' | 'points';

export class AppliedFilters {
  private constructor(private readonly value: string) {}

  static builder(): AppliedFiltersBuilder {
    return new AppliedFiltersBuilder();
  }

  static fromChoices(sort: SortBy, titleRule?: TitleWordRule): AppliedFilters {
    const sortLabel =
      sort === 'comments'
        ? 'sort:number_of_comments:desc'
        : 'sort:number_of_points:desc';
    const titleLabel = titleRule
      ? `sort:title_words:${titleRule.operator}:${titleRule.value}`
      : undefined;

    return new AppliedFilters(
      [sortLabel, titleLabel]
        .filter((label): label is string => label !== undefined)
        .join('|')
    );
  }

  static fromString(value: string): AppliedFilters {
    return new AppliedFilters(value);
  }

  toString(): string {
    return this.value;
  }
}

export class AppliedFiltersBuilder {
  private sort?: SortBy;
  private titleRule?: TitleWordRule;

  sortBy(sort: SortBy): this {
    this.sort = sort;
    return this;
  }

  titleWords(rule?: TitleWordRule): this {
    this.titleRule = rule;
    return this;
  }

  build(): AppliedFilters {
    if (!this.sort) throw new Error('An applied sort is required.');
    return AppliedFilters.fromChoices(this.sort, this.titleRule);
  }
}
