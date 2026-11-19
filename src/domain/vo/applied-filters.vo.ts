import type { TitleWordRule } from '@/domain/policies/entry-filter.policy';

type SortBy = 'comments' | 'points';

export class AppliedFilters {
  private constructor(private readonly value: string) {}

  static builder(): AppliedFiltersBuilder {
    return new AppliedFiltersBuilder();
  }

  static fromOptionalChoices(
    sort?: SortBy,
    titleRule?: TitleWordRule
  ): AppliedFilters {
    const labels = [
      sort === 'comments'
        ? 'sort:number_of_comments:desc'
        : sort === 'points'
          ? 'sort:number_of_points:desc'
          : undefined,
      titleRule
        ? `filter:title_words:${titleRule.operator}:${titleRule.value}`
        : undefined,
    ].filter((label): label is string => label !== undefined);

    return new AppliedFilters(labels.join(',') || 'none');
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
    return AppliedFilters.fromOptionalChoices(this.sort, this.titleRule);
  }
}
