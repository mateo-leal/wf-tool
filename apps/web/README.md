# Tenno Companion

[![Crowdin](https://badges.crowdin.net/tenno-companion/localized.svg)](https://crowdin.com/project/tenno-companion)
[![build](https://github.com/mateo-leal/tenno-companion/actions/workflows/test.yml/badge.svg)](https://github.com/mateo-leal/tenno-companion/actions/workflows/test.yml)

Warframe companion web app focused on KIM dialogue simulation plus practical daily tooling:

- KIM chatroom pathfinder and transcript simulation.
- Daily/weekly checklist tracking with live reset timers.
- Mastery completion checklist from live item data.
- Home widgets for world cycles and in-game news.
- Multi-language UI.

## Features

### KIM Pathfinder

- Browse available KIM chatrooms and dialogue starts.
- Simulate conversation paths using boolean and counter input state.
- Compare ranked preferred outcomes (best chemistry, thermostat, overall, and boolean-heavy routes).
- Split recommendations by flirting-state outcomes when the graph branches that way.
- View each result as an in-app chat transcript and persist mutations for later runs.

### Checklist Tracker

- Daily, weekly, and manual sections.
- Auto-reset behavior for UTC daily/weekly periods.
- Additional rotation handling (hourly, 8-hour, Sortie, and Baro windows).
- Progress persistence with per-task completion, hidden rows, and expandable groups.

### Mastery Checklist

- Builds category/subcategory mastery data from `@tenno-companion/core`.
- Includes mastery-point-aware item grouping.
- Locale-aware item names when available.

### Widgets and Live Data

- World cycle cards (Cetus, Vallis, Cambion, Duviri, Zariman) with live countdowns.
- News feed from live world state events.

### Localization

- Locale routing via `next-intl` with `as-needed` locale prefixing.
- Language selector in settings and translation contribution link to Crowdin.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS 4
- next-intl
- Jest + Testing Library
- pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Install

```bash
pnpm install
```

### Run locally

```bash
pnpm dev
```

Open http://localhost:3000.

### Build and run production

```bash
pnpm build
pnpm start
```

### Lint and tests

```bash
pnpm lint
pnpm test
pnpm test:watch
```

## Main Routes

- `/`: Home dashboard with widgets and quick-launch shortcuts.
- `/kim`: KIM landing/select experience.
- `/kim/[chatroom]`: Chatroom-specific KIM simulation route.
- `/checklist`: Daily/weekly/other checklist tracker.
- `/mastery`: Mastery checklist view.

All routes are locale-aware under `app/[locale]`.

## API Endpoints

### `GET /api/dialogues`

Query params:

- `chatroom` (required): chatroom id.
- `language` (optional): language code.
- `booleans` (optional): JSON object used to resolve boolean-gated previews.

Response:

- `options`: array of `{ option, id, label, codename }`.

### `GET /api/simulate`

Query params:

- `chatroom` (required)
- `startId` (required)
- `language` (optional)
- `booleans` (optional JSON object)
- `counters` (optional JSON object)

Response:

- `conversationName`
- `options`: ranked path options with metrics, mutations, and formatted `chatLines`.

## Project Structure

Frequently used folders:

- `app`: Locale routes, metadata, and API handlers.
- `components`: Windowed UI, KIM/chat components, checklist/mastery panels, taskbar, and widgets.
- `lib/kim`: Graph loading, traversal, ranking, and formatting logic for KIM.
- `lib/checklist`: Task definitions, reset logic, and checklist state sanitization.
- `lib/mastery`: Mastery dataset assembly from item sources.
- `lib/world-state`: World state fetchers and related types.
- `messages`: Locale dictionaries.

Key entry points:

- `app/[locale]/layout.tsx`
- `app/[locale]/kim/[chatroom]/page.tsx`
- `components/windows/chat.tsx`
- `components/kim/dialogue-selector-panel/simulation-form.tsx`
- `app/api/dialogues/route.ts`
- `app/api/simulate/route.ts`

## Contributing

1. Fork and clone.
2. Create a branch from `main`.
3. Make focused changes.
4. Run `pnpm lint`, `pnpm test`, and `pnpm build`.
5. Open a pull request with a clear summary and screenshots/GIFs for UI changes.

Guidelines:

- Keep PRs scoped and reviewable.
- Preserve strict typing and reuse existing utilities when possible.
- Update docs when behavior changes.

## Acknowledgements

- [browse.wf](https://browse.wf/) for world-state data sources and references.
- [warframe-public-export-plus](https://github.com/calamity-inc/warframe-public-export-plus) items and dictionaries data.
- [warframe-kim-dialogues](https://github.com/Sainan/warframe-kim-dialogues) KIM dialogues and dictionaries data.

## License

This package is licensed under MIT License. See [LICENSE](https://github.com/mateo-leal/tenno-companion/blob/main/LICENSE) for details.
