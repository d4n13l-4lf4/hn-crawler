# CLI Command Contract: hn-crawler

**Feature**: 001-base-project-scaffolding  
**Date**: 2026-11-17  
**Version**: 1.0.0

---

## Command Signature

```bash
hn-crawler [options] [command]
```

---

## Options

| Flag        | Alias | Type      | Description            | Default |
| ----------- | ----- | --------- | ---------------------- | ------- |
| `--help`    | `-h`  | `boolean` | Display help text      | `false` |
| `--version` | `-V`  | `boolean` | Display version number | `false` |

---

## Commands (Future)

| Command  | Description                          | Status               |
| -------- | ------------------------------------ | -------------------- |
| `scrape` | Scrape Hacker News and apply filters | Planned (next story) |

> **Note**: For this scaffolding story, only the default action (no subcommand) is implemented.

---

## Default Action (No Subcommand)

### Behavior

When invoked without a subcommand, the CLI prints "Hello World" to stdout and exits with code 0.

### Input

- No arguments required
- Options `--help` and `--version` handled by Commander (exit early)

### Output

```
Hello World
```

### Exit Codes

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 0    | Success (hello world printed)            |
| 1    | Error (unexpected failure)               |
| 2    | Commander error (unknown option/command) |

---

## Help Output (`--help`)

```
Usage: hn-crawler [options] [command]

A standalone CLI that scrapes Hacker News entries, applies filters, and records usage data.

Options:
  -V, --version    output the version number
  -h, --help       display help for command

Commands:
  scrape           Scrape Hacker News and apply filters (coming soon)
  help [command]   display help for command
```

---

## Version Output (`--version`)

```
1.0.0
```

(Version sourced from `package.json`)

---

## Error Cases

### Unknown Option

```bash
$ hn-crawler --unknown
```

**Output** (stderr):

```
error: unknown option '--unknown'
```

**Exit Code**: 2

### Unknown Command

```bash
$ hn-crawler unknown-command
```

**Output** (stderr):

```
error: unknown command 'unknown-command'
```

**Exit Code**: 2

---

## Environment Variables

| Variable         | Purpose                                        | Used By                     |
| ---------------- | ---------------------------------------------- | --------------------------- |
| `HN_CRAWLER_BIN` | Path to CLI binary for acceptance tests        | Acceptance test World class |
| `NODE_ENV`       | Node environment (development/test/production) | Optional, for future config |

---

## Contract Compliance

### Required for This Story

- [x] `hn-crawler` prints "Hello World" on default action
- [x] `--help` shows usage with commands list
- [x] `--version` prints package.json version
- [x] Unknown options/commands show Commander error and exit 2

### Deferred (Future Stories)

- [ ] `scrape` subcommand with URL option
- [ ] Filter selection (`--filter long|short`)
- [ ] Output format (`--format json|table`)
- [ ] Config file support
