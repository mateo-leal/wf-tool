[![Crowdin](https://badges.crowdin.net/tenno-companion/localized.svg)](https://crowdin.com/project/tenno-companion)

# wf-kim-pathfinder

KIM Pathfinder is a Next.js web app that explores and simulates Warframe KIM dialogue graphs.

Contributors can use this project to:

- Browse available chatrooms and conversations.
- Simulate preferred conversation paths based on boolean and counter state.
- Compare paths by chemistry, thermostat, and boolean activations.
- View simulated conversations as chat transcripts.
- Switch language dictionaries for translated dialogue labels.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS 4
- pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

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

### Lint

```bash
pnpm lint
```

## Project Structure

Top-level folders used most often:

- app: Next.js routes, layouts, and API handlers.
- components: UI components for chatroom selection, dialogue simulation, and transcript rendering.
- lib/kim: Pathfinder engine and graph traversal logic.
- lib/chatrooms.ts: Chatroom metadata and source JSON endpoints.
- lib/language.ts: Supported language list and dictionary URL resolver.
- lib/types.ts: Shared graph node and transcript types.

Important entry points:

- app/kim/[chatroom]/page.tsx: SSG route for each chatroom view.
- components/windows/chat.tsx: Server component that loads graph data and prepares simulation requirements.
- components/dialogue-selector-panel.tsx: Client state for language, booleans, counters, and simulation requests.
- app/api/simulate/route.ts: Simulation API endpoint.
- app/api/dialogues/route.ts: Language-aware dialogue option labels endpoint.

## Data Flow Overview

1. A user opens a chatroom route under /kim/[chatroom].
2. The server loads graph nodes from browse.wf and builds dialogue options.
3. The client panel collects user state (booleans/counters) and calls /api/simulate.
4. The simulation engine traverses the graph, ranks preferred paths, and returns transcript lines.
5. The UI shows ranked path cards and a rendered chat transcript.

Language behavior:

- Default language is English (en) and uses server-rendered labels.
- Selecting another language fetches translated labels from /api/dialogues.
- Selected language is persisted in localStorage (wf-kim:language).

Boolean persistence:

- Boolean mutations can be saved to localStorage (wf-kim:booleans) from a simulated transcript.
- Saved booleans are reused when preparing subsequent simulations.

## API Endpoints

### GET /api/dialogues

Query params:

- chatroom (required): chatroom id such as hex, arthur, marie.
- language (optional): one of the supported language codes.

Response:

- options: array of { option, id, label, codename }.

### GET /api/simulate

Query params:

- chatroom (required)
- startId (required)
- language (optional)
- booleans (optional JSON object)
- counters (optional JSON object)

Response:

- conversationName
- options: ranked preferred paths with metrics, booleanMutations, and chatLines.

## Core Simulation Concepts

- Chemistry: sum of ChemistryDelta changes along a path.
- Thermostat: sum of thermostat-tagged OtherDialogueInfos values.
- Boolean activations: count of set/reset boolean mutations.
- Counter checks: evaluate Output expressions against provided counter values.
- Multi-boolean checks: route selection using check expressions in output branches.

Implementation is centered in lib/kim/pathfinder.ts.

## Static Generation

- /kim/[chatroom] is pre-rendered with generateStaticParams from app/kim/[chatroom]/page.tsx.
- Chatrooms are generated from keys in lib/chatrooms.ts.

If you add a new chatroom id to CHATROOM_SOURCE_BY_ID, it will be included in static generation automatically.

## Contributing

### Typical workflow

1. Fork and clone.
2. Create a branch from main.
3. Make focused changes.
4. Run pnpm lint and pnpm build.
5. Open a pull request with a clear problem statement and screenshots/GIFs for UI changes.

### Contribution guidelines

- Keep PRs small and scoped.
- Preserve TypeScript strictness and avoid any casts unless required.
- Reuse existing helpers in lib/kim/pathfinder.ts before adding duplicates.
- Keep UI style consistent with the KIM in-game visual direction.
- Add or update documentation when behavior changes.

## Known Gaps

- No automated test suite is configured yet.
- Some metadata and labels are still coupled to upstream browse.wf payload conventions.

Contributions for tests, resilience, and API hardening are welcome.

## Acknowledgements

Special thanks to [browse.wf](https://browse.wf/) for making Warframe dialogue data easy to explore and reference. This project relies on browse.wf endpoints for chatroom graph and dictionary sources.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).
