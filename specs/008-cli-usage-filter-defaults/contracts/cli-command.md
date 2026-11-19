# CLI Contract: Crawl Options, Usage Descriptions, and Version

## Crawl command

- `hn-crawler crawl` retrieves up to 30 entries and preserves source order, with no title filter or ranking; usage records `none`.
- `hn-crawler crawl --title-words gt:N|le:N` applies only the title filter and preserves source order.
- `hn-crawler crawl --top-comments` ranks all retrieved entries by comments descending.
- `hn-crawler crawl --top-points` ranks all retrieved entries by points descending.
- A title filter may be combined with either ranking option; filtering is applied before ranking.
- Supplying both ranking options remains an argument error.
- Beta-only URL selection and production behavior remain as currently defined.

## Usage command

Applied operation descriptions use the following forms:

- No filter or ranking: `none`
- Ranking: `sort:number_of_comments:desc` or `sort:number_of_points:desc`
- Title rule: `filter:title_words:<comparator>:<limit>`
- Both: comma-separated ranking and title-rule labels

## Version option

`hn-crawler --version` displays the package metadata version. This contract is not covered by acceptance scenarios per requirement.
