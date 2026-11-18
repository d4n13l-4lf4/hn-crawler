# Research: Stabilize Acceptance Tests

## Decision: explicit full database path override

- **Decision**: Use `HN_CRAWLER_DB_PATH` as the full SQLite file path when it is non-empty; otherwise retain the existing `env-paths('hn-crawler')` data location and filename.
- **Rationale**: The acceptance workflow needs a known, isolated database location, while ordinary CLI users should keep the existing per-user default without configuration.
- **Alternatives considered**: A test-only `HN_CRAWLER_TEST_DB_PATH` override was already present but gives acceptance infrastructure a special configuration path. Using only `env-paths` leaves tests coupled to runner state and platform defaults.

## Decision: generate CI path in the acceptance workflow

- **Decision**: Generate a unique temporary SQLite file path in a step immediately before acceptance execution and export it through the workflow environment for both Cucumber and spawned CLI processes.
- **Rationale**: A run-scoped path prevents the acceptance suite from reading or modifying persistent runner/user data.
- **Alternatives considered**: A fixed path risks stale state across runs; relying on the OS user-data path is not isolated.

## Decision: preserve Commander error prefix assertions and status checks

- **Decision**: Keep `error:` assertions for Commander-generated errors. Keep custom argument validation messages unchanged and assert their specific message text plus non-zero status.
- **Rationale**: The latest acceptance results show that asserting a generic Commander prefix against custom validation messages creates false failures. Assertions should match the actual documented error type without weakening exit-status checks.
- **Alternatives considered**: Adding the Commander prefix to all custom validation errors would change their current CLI output without being required by the clarified contract.

## Decision: remove obsolete Hello World acceptance coverage

- **Decision**: Remove the Hello World feature and steps because the current CLI exposes `crawl` and `usage` instead.
- **Rationale**: The saved acceptance results show this stale scenario fails because the behavior no longer exists.
- **Alternatives considered**: Restoring the Hello World default command conflicts with the current CLI contract.

## Decision: acceptance suite is manually executed by the user

- **Decision**: Implementation runs unit tests, quality gates, build, and static workflow inspection, but does not execute the acceptance suite.
- **Rationale**: The user will manually exercise acceptance after reviewing the implementation.
- **Alternatives considered**: Running acceptance during implementation was explicitly excluded by the user.

## Existing acceptance URL constraint

- **Decision**: Keep `HN_CRAWLER_ACCEPTANCE_URL` and its repository configuration unchanged for this feature.
- **Rationale**: The user explicitly excluded further changes; the acceptance input source is outside the scoped fixes.
- **Alternatives considered**: A local deterministic fixture server is compatible with the constitution's fixture guidance but would expand the agreed scope and require separate approval/planning.
