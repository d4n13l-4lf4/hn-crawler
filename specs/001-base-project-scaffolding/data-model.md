# Data Model: Base Project Scaffolding

**Feature**: 001-base-project-scaffolding  
**Date**: 2026-11-17

---

## Entities

### 1. CLI Command

Represents the Commander command definition for `hn-crawler`.

| Field           | Type                  | Description                 | Validation                               |
| --------------- | --------------------- | --------------------------- | ---------------------------------------- |
| `name`          | `string`              | Command name (`hn-crawler`) | Required, lowercase, kebab-case          |
| `version`       | `string`              | Semver from `package.json`  | Required, valid semver                   |
| `description`   | `string`              | One-line summary            | Required, max 120 chars                  |
| `defaultAction` | `() => Promise<void>` | Hello world output function | Required, prints "Hello World" to stdout |

**Relationships**:

- Defined in `src/presentation/cli.ts`
- Instantiated in `src/presentation/main.ts` (composition root)

---

### 2. Quality Gate Result

Represents the outcome of a single quality gate check.

| Field        | Type      | Description                                             | Validation                     |
| ------------ | --------- | ------------------------------------------------------- | ------------------------------ |
| `name`       | `string`  | Gate identifier (`format`, `lint`, `typecheck`, `test`) | Required, enum                 |
| `passed`     | `boolean` | Whether the gate passed                                 | Required                       |
| `durationMs` | `number`  | Execution time in milliseconds                          | Required, ≥ 0                  |
| `output`     | `string`  | Tool stdout/stderr (truncated)                          | Optional                       |
| `error`      | `string`  | Error message if failed                                 | Required if `passed === false` |

**Relationships**:

- Produced by `npm run quality` script
- Consumed by Husky pre-commit hook and CI workflow

---

### 3. Beta Release Metadata

Represents the version information for a beta npm publish.

| Field         | Type     | Description                                    | Validation                        |
| ------------- | -------- | ---------------------------------------------- | --------------------------------- |
| `baseVersion` | `string` | Version from `package.json` (e.g., `1.0.0`)    | Required, valid semver            |
| `shortSha`    | `string` | Git short commit SHA (7 chars)                 | Required, hex, length 7           |
| `betaVersion` | `string` | Computed: `${baseVersion}-beta.sha${shortSha}` | Required, valid semver prerelease |
| `npmTag`      | `string` | Always `beta`                                  | Constant                          |
| `publishedAt` | `Date`   | Timestamp of publish                           | Required, ISO 8601                |

**Relationships**:

- Generated in `beta-release` GitHub Actions workflow
- Consumed by `acceptance-tests` workflow for installation

---

### 4. Project Structure Manifest

Represents the expected folder/file layout for validation.

| Field                      | Type       | Description                        | Validation                                                               |
| -------------------------- | ---------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `srcLayers`                | `string[]` | Required layer folders             | Must include: `domain`, `application`, `infrastructure`, `presentation`  |
| `applicationSubfolders`    | `string[]` | Required application subfolders    | Must include: `ports`, `pipeline`, `pipeline/steps`, `pipeline/composed` |
| `infrastructureSubfolders` | `string[]` | Required infrastructure subfolders | Must include: `web`, `persistence`                                       |
| `testFolders`              | `string[]` | Required test folders              | Must include: `unit`, `acceptance`, `fixtures`                           |
| `acceptanceSubfolders`     | `string[]` | Required acceptance subfolders     | Must include: `features`, `steps`                                        |

**Relationships**:

- Defined in ARCHITECTURE.md scaffolding table
- Validated by quickstart verification script

---

## Enumerations

### QualityGateName

```typescript
type QualityGateName = 'format' | 'lint' | 'typecheck' | 'test';
```

### LayerName

```typescript
type LayerName = 'domain' | 'application' | 'infrastructure' | 'presentation';
```

---

## Validation Rules

1. **CLI Command**: Must output exactly "Hello World\n" to stdout with exit code 0 when invoked with no arguments.
2. **Quality Gate**: All four gates must pass (`passed === true`) for commit/merge to proceed.
3. **Beta Version**: Must match regex `/^\d+\.\d+\.\d+-beta\.sha[a-f0-9]{7}$/`.
4. **Project Structure**: All required folders must exist; extra folders allowed only with architectural justification.

---

## State Transitions

### Quality Gate Execution

```
PENDING → RUNNING → PASSED
                → FAILED (blocks commit/merge)
```

### Beta Release

```
VERSION_SET → CI_PASSED → BETA_PUBLISHED → ACCEPTANCE_PASSED → RELEASE_READY
                    → CI_FAILED (blocks)
                    → BETA_FAILED (blocks)
                    → ACCEPTANCE_FAILED (blocks)
```
