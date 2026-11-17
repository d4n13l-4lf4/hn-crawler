# Hacker News Crawler

A CLI tool to scrape and analyze the top Hacker News entries.

## Features

This is the **MVP (Minimum Viable Product)** version with the following capabilities:

- Default "Hello World" command to validate toolchain works end-to-end
- Full hexagonal architecture scaffolding
- CLI with --help and --version options
- Complete CI/CD pipeline with GitHub Actions workflows

**Note**: The actual scraping functionality, filtering, sorting, and SQLite storage will be implemented in future user stories.

## Installation

```bash
npm install -g hn-crawler
```

## Usage

```bash
# Default command - shows "Hello World"
hn-crawler

# Show help
hn-crawler --help

# Show version
hn-crawler --version
```

## Development

### Prerequisites

- Node.js 26 LTS
- npm

### Setup

```bash
git clone https://github.com/d4n13l-4lf4/hn-crawler.git
cd hn-crawler
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
# Run unit tests directly from TypeScript
npm run test:unit

# Run unit tests with 100% coverage
npm run test:coverage

# Run the local acceptance suite against this working tree
npm run test:acceptance:local

# Run quality gates
npm run quality
```

## Publishing

GitHub Actions publishing requires an `NPM_TOKEN` repository secret with permission to publish the package to npm. Beta packages are installed in acceptance CI using the exact version recorded in the beta-release artifact.

## License

MIT
