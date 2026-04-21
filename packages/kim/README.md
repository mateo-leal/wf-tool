# @tenno-companion/kim

KIM dialogue and chatroom data library for Tenno Companion. This package provides access to Warframe KIM chatroom data, dialogue content, and related utilities for integration into your Warframe companion applications.

## Install

```bash
npm install @tenno-companion/kim
```

Or with pnpm:

```bash
pnpm add @tenno-companion/kim
```

Or with yarn:

```bash
yarn add @tenno-companion/kim
```

## Usage

The kim library provides dialogue simulation and path optimization for Warframe KIM chatrooms.

### Basic Usage

```ts
import { Chat } from '@tenno-companion/kim/server'
import { Simulation } from '@tenno-companion/kim'
import { PathSelector } from '@tenno-companion/kim'

// Load a chatroom
const chat = await Chat.create('hex')

// Create a simulation
const sim = new Simulation(chat)

// Get all possible paths from the start node
const startNode = chat.startNodes[0]
const paths = sim.getPaths(startNode)

// Select optimized paths
const optimized = PathSelector.selectBestPaths(paths)
console.log(optimized.bestGeneral) // Best overall path
```

### With Localization

```ts
// Load a chatroom in a specific locale
const chat = await Chat.create('hex', { locale: 'es' })

const sim = new Simulation(chat)
const paths = sim.getPaths(chat.startNodes[0])
```

### Available Chatrooms

- The Hex chatrooms
  - `'amir'`
  - `'arthur'`
  - `'aoi'`
  - `'eleanor'`
  - `'flare'`
  - `'hex'`
  - `'kaya'`
  - `'lettie'`
  - `'minerva'` - Supported, but empty
  - `'minerva-velimir'`
  - `'quincy'`
  - `'velimir'` - Supported, but empty
- La Cathédrale chatroom
  - `'loid'`
  - `'lyon'`
  - `'marie'`
  - `'roathe'`

### API

- **`Chat.create(chatroomId, options?)`** — Load a chatroom with optional locale
  - `chatroomId` — ID of the chatroom to load
  - `options.locale` — Locale code (default: `'en'`)
  - Returns: `Promise<Chat>` with nodes and dialogue data

- **`new Simulation(chat)`** — Create a simulation for path analysis
  - `getPaths(startNode)` — Get all possible dialogue paths from a node

- **`PathSelector.selectBestPaths(paths)`** — Optimize dialogue paths
  - Returns optimized path selections including `bestGeneral`

## Data

The package includes:

- **Chatroom definitions** — KIM chatroom metadata including The Hex and La Cathédrale locations
- **Dialogue data** — Complete KIM dialogue content with multi-language support
- **Localization** — Multi-language support for dialogue and chatroom names across multiple locales

## Types

Full TypeScript support is included. Import types as needed:

```ts
import type { Chatroom, Node } from '@tenno-companion/kim/types'
```

## Browser Support

This package works in Node.js and modern browsers with ES2020+ support.

### Bundle Size Optimization

The package is split into two exports to optimize bundle size for browser usage:

- **`@tenno-companion/kim`** — Browser-compatible export without bundled data (smaller bundle)
  - Suitable for web applications
  - Data must be fetched or provided separately
  - Exports types, utilities, and client-side classes

- **`@tenno-companion/kim/server`** — Server export with full data included
  - Suitable for Node.js servers and build-time data generation
  - Includes all dialogue and chatroom data
  - Use `Chat.create()` from this export to load chatrooms with data

If you're building a web application, import from the main package and fetch dialogue data from your server:

```ts
import { Simulation, PathSelector } from '@tenno-companion/kim'

// Fetch chat data from your server
const nodes = await fetch('/api/chatroom/hex/nodes').then((r) => r.json())
const chat = new Chat('hex', nodes)

const sim = new Simulation(chat)
const paths = sim.getPaths(chat.startNodes[0])
```

For server-side rendering or Node.js applications, use the server export which includes all data:

```ts
import { Chat } from '@tenno-companion/kim/server'

const chat = await Chat.create('hex')
```

## License

This package is licensed under MIT License. See [LICENSE](https://github.com/mateo-leal/tenno-companion/blob/main/LICENSE) for details.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/mateo-leal/tenno-companion/blob/main/CONTRIBUTING.md) for guidelines.

## Related Packages

- [@tenno-companion/core](https://www.npmjs.com/package/@tenno-companion/core) — Core Warframe data library
