# Research: CLI Usage and Filter Defaults

## Decision: Represent absent filtering and ranking explicitly in the crawl request

**Rationale**: Presentation must distinguish omitted flags from selected flags so the application can omit pipeline operations and usage can represent the true request. The existing request currently requires a sort choice and the CLI injects both old defaults.

**Alternatives considered**: Continue encoding defaults in the CLI; rejected because it cannot distinguish a no-option request and would preserve the behavior the feature replaces.

## Decision: Compose only the requested pipeline steps

**Rationale**: The existing async pipeline supports independent operators. Omit the title filter when absent and omit ranking when absent. With neither selected, pass the bounded first-30 source sequence through unchanged.

**Alternatives considered**: Add a separate no-op pipeline implementation; rejected as unnecessary abstraction.

## Decision: Keep applied-filter descriptions as text with explicit `none`

**Rationale**: SQLite already stores applied filters as text and usage prints the value object string. The scope requires new descriptions but no new query or structured breakdown. Keep ranking labels as `sort:<metric>:desc`, switch title rules to `filter:title_words:<comparator>:<limit>`, join selected operations with a comma, and use `none` if no labels are selected.

**Alternatives considered**: Add columns or a schema migration for each operation; rejected because no new query behavior requires structured fields.

## Decision: Read the CLI version from the package metadata

**Rationale**: `package.json` is the project's canonical release version source per `docs/CICD.md`. Use the package metadata available to the CLI at runtime/build time; this can be verified in unit tests without adding an acceptance scenario.

**Alternatives considered**: Maintain a second version constant; rejected because it can drift.

## Decision: Defer acceptance execution to the user

**Rationale**: The user requested acceptance scenarios and steps be written first, with the suite manually run only at the end. Continue to use the existing deterministic URL setup and standalone CLI steps; do not execute Cucumber during these implementation milestones.

**Alternatives considered**: Run acceptance alongside each milestone; rejected by the explicit user workflow.
