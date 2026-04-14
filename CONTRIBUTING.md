# Contributing to wf-kim-pathfinder

Thank you for helping improve the project. This guide covers everything you need to get set up, where to find the relevant code, and how pull requests are reviewed.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting started](#getting-started)
- [Project layout](#project-layout)
- [Development workflow](#development-workflow)
- [Pull request guidelines](#pull-request-guidelines)
- [Adding or updating features](#adding-or-updating-features)
  - [Adding a KIM chatroom](#adding-a-kim-chatroom)
  - [Adding a checklist task](#adding-a-checklist-task)
  - [Adding a translation string](#adding-a-translation-string)
- [Code style](#code-style)
- [Testing](#testing)
- [Translations](#translations)

---

## Code of Conduct

Be respectful, constructive, and welcoming to everyone regardless of experience level.

---

## Getting started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open http://localhost:3000.

**Prerequisites:** Node.js 20+, pnpm 10+.

---

## Project layout

```
app/[locale]/          Next.js page routes (checklist, kim, mastery, migrate)
app/api/               API route handlers (dialogues, simulate)
components/            All UI components
  kim/                 KIM selector and transcript components
  checklist/           Checklist panel and task rows
  mastery/             Mastery checklist panel
  widgets/             Home widgets (world cycles, news)
  windows/             Windowed layout components
  providers/           Client-side context providers
lib/
  kim/                 Graph loader, explorer, ranker, formatter, boolean/counter utils
  checklist/           Task definitions, reset logic, state sanitization
  mastery/             Mastery data assembly from @wfcd/items
  world-state/         World state fetch helpers
messages/              Locale JSON dictionaries (en.json is canonical)
```

---

## Development workflow

1. Create a branch from `main` with a descriptive name:

   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-bug
   ```

2. Make focused, well-scoped commits.

3. Before opening a PR, run:

   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

4. Open a pull request against `main` with:
   - A clear description of **what** changed and **why**.
   - Screenshots or GIFs for any visible UI changes.

---

## Pull request guidelines

- Keep PRs small and reviewable. One concern per PR is ideal.
- Prefer editing existing files over adding new ones unless a new module is genuinely needed.
- Don't add docstrings, comments, or type annotations to code you didn't touch.
- Don't refactor or reformat code outside the scope of your change.
- All CI checks (lint, tests, build) must pass before merging.

---

## Adding or updating features

### Adding a KIM chatroom

1. Open `lib/kim/chatrooms.ts`.
2. Add a new entry to `CHATROOM_SOURCE_BY_ID` with the chatroom id as the key and the `kim.browse.wf` JSON URL as the value.
3. Add a speaker entry to `SPEAKERS` if the character is new.
4. Add a display entry to the appropriate group array (`HEX_CHATROOMS` or `CATHEDRALE_CHATROOMS`).

The new chatroom will be automatically included in static generation and the selector UI.

### Adding a checklist task

1. Open `lib/checklist/tasks.ts`.
2. Add a `ChecklistTask` entry to `DAILY_TASKS`, `WEEKLY_TASKS`, or `OTHER_TASKS`.
3. Add translated labels for all applicable keys to every file in `messages/`. The `en.json` keys live under `checklist.daily.tasks`, `checklist.weekly.tasks`, or `checklist.other.tasks`.

For tasks with subitems, set list children under `subitems`.

Reset behavior is controlled by the `resets` field:

- `'daily'` — clears at UTC midnight.
- `'weekly'` — clears at the start of the UTC week.
- `'sortie'` — clears at 16:00 UTC daily.
- `'eightHours'` — clears on 8-hour intervals anchored at 08:00 UTC.
- `'hourly'` — clears every hour.
- `'baro'` — clears on Baro Ki'Teer arrival/departure.
- Omitted — manual only, never auto-clears.

### Adding a translation string

1. Add the key and English value to `messages/en.json` in the appropriate namespace.
2. The key will show up on [Crowdin](https://crowdin.com/project/tenno-companion) for community translation.
3. If you can provide translations yourself, add them to the relevant `messages/<locale>.json` files too.

---

## Code style

- TypeScript strict mode is enforced — avoid `any` casts.
- Use `clsx` / `cn` (from `lib/utils`) for conditional class names.
- Reuse existing helpers in `lib/kim/` before writing new graph utilities.
- Server components and client components are separated; don't add `'use client'` unless the component genuinely needs browser APIs or React state/effects.
- Use the `next-intl` helpers (`useTranslations`, `getTranslations`) for all user-facing strings. Hard-coded English strings in components are not acceptable for new code.

---

## Testing

Tests live alongside their modules in `__tests__/` subdirectories and use Jest + Testing Library.

```bash
pnpm test           # Run all tests once
pnpm test:watch     # Watch mode
```

- Add tests for new pure utility functions in `lib/`.
- UI component tests are welcome but not required for every change.
- All existing tests must continue to pass.

---

## Translations

The UI is translated via [Crowdin](https://crowdin.com/project/tenno-companion). If you want to improve a translation or add support for a language that is not yet covered:

1. Visit the Crowdin project page and join.
2. The source language is English (`messages/en.json`).
3. Translated strings are synced to `messages/<locale>.json` files.

If you notice a translation issue in a PR, note it in the review — no need to block the PR for it.
