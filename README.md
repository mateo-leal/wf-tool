# Tenno Companion

[![Crowdin](https://badges.crowdin.net/tenno-companion/localized.svg)](https://crowdin.com/project/tenno-companion)
[![build](https://github.com/mateo-leal/tenno-companion/actions/workflows/test.yml/badge.svg)](https://github.com/mateo-leal/tenno-companion/actions/workflows/test.yml)

A TypeScript-based monorepo for [Tenno Companion](https://tennocompanion.com), a comprehensive tool for Warframe players.

## Repository Structure

This is a pnpm monorepo organized using Turbo for build orchestration. It consists of:

### Applications

- **`apps/web`** — Next.js web application for the main Tenno Companion interface
  - KIM Pathfinder: Graph-based dialogue search and simulation
  - Checklist: Daily/weekly task tracker with world state integration
  - Mastery: Mastery rank progression insights
  - Live widgets: World cycle counters, news feeds

### Packages

- **`packages/core`** — Shared data models, constants, and utility library published to npm
  - Warframe game constants and data structures
  - Locale definitions and translations
  - Public exports for third-party developers

## Getting Started

### Prerequisites

- Node.js 22.17.0 or higher
- pnpm 10.33.0 or higher

### Installation

```bash
# Install all dependencies
pnpm install

# Start development servers for all workspaces
pnpm dev

# Build all workspaces
pnpm build

# Run tests across all workspaces
pnpm test
```

Open http://localhost:3000 after running `pnpm dev`.

## Workspace-Specific Commands

```bash
# Work specifically in apps/web
pnpm --filter tenno-companion dev
pnpm --filter tenno-companion build
pnpm --filter tenno-companion test

# Work specifically in packages/core
pnpm --filter @tenno-companion/core build
pnpm --filter @tenno-companion/core test
```

## Project Layout

See [CONTRIBUTING.md](./CONTRIBUTING.md) for a detailed project layout and development guidelines.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:

- Development workflow
- Code style standards
- Testing and type safety
- Translations and localization
- Pull request process

## Code of Conduct

This project adheres to the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/mateo-leal/tenno-companion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mateo-leal/tenno-companion/discussions)
