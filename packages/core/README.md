# @tenno-companion/core

Core Warframe data library for Tenno Companion. This package provides Warframe-related data providers, locale utilities, and stable exported types for integration into your Warframe companion applications.

## Install

```bash
npm install @tenno-companion/core
```

Or with pnpm:

```bash
pnpm add @tenno-companion/core
```

Or with yarn:

```bash
yarn add @tenno-companion/core
```

## Usage

Import providers from the package root and locale helpers from `@tenno-companion/core/locales`.

```ts
import {
  ArchwingProvider,
  NecramechProvider,
  PetProvider,
  RailjackIntrinsicProvider,
  WarframeProvider,
  WeaponProvider,
} from '@tenno-companion/core'
import { sortByName } from '@tenno-companion/core/locales'

async function buildMasteryData(locale = 'en') {
  const [items, railjackIntrinsics] = await Promise.all([
    getItems(locale),
    getRailjackIntrinsics(locale),
  ])

  return {
    itemCompletion: items,
    railjackIntrinsic: railjackIntrinsics.masteryItems,
    drifterIntrinsic: {},
    starchartCompletion: {},
    subcategoryLabels: {
      itemCompletion: {},
      railjackIntrinsic: railjackIntrinsics.labels,
      drifterIntrinsic: {},
      starchartCompletion: {},
    },
  }
}

async function getItems(locale: string) {
  const warframes = await WarframeProvider.create({ locale })
  const weapons = await WeaponProvider.create({ locale })
  const pets = await PetProvider.create({ locale })
  const archwings = await ArchwingProvider.create({ locale })
  const necramechs = await NecramechProvider.create({ locale })

  return {
    warframe: warframes.getAll(),
    primary: weapons.getPrimaries(),
    secondary: sortByName(weapons.getSecondaries({ masterable: true }), {
      locale,
    }),
    melee: sortByName(weapons.getMelees({ masterable: true }), { locale }),
    robotic: sortByName(pets.getSentinels({ masterable: true }), { locale }),
    companion: pets.getBeasts({ masterable: true, includeSpecial: true }),
    vehicle: sortByName(
      [
        ...archwings.getAll(),
        ...necramechs.getAll(),
        ...weapons.getKDrives({ masterable: true }),
      ],
      { locale }
    ),
  }
}

async function getRailjackIntrinsics(locale: string) {
  const provider = await RailjackIntrinsicProvider.create({ locale })
  return provider.getAll()
}
```

### Example provider methods

- `WarframeProvider.create({ locale })`
- `WeaponProvider.create({ locale })`
- `PetProvider.create({ locale })`
- `ArchwingProvider.create({ locale })`
- `NecramechProvider.create({ locale })`
- `RailjackIntrinsicProvider.create({ locale })`

Common `WeaponProvider` methods:

- `getPrimaries()`
- `getSecondaries({ masterable: true })`
- `getMelees({ masterable: true })`
- `getArchguns()`
- `getArchmelees()`
- `getAmps()`
- `getKDrives({ masterable: true })`
- `getZaws({ masterable: true })`
- `getKitguns({ masterable: true })`

Common `PetProvider` methods:

- `getSentinels({ masterable: true })`
- `getMOAs({ masterable: true })`
- `getHounds({ masterable: true })`
- `getBeasts({ masterable: true, includeSpecial: true })`
- `getSentinelWeapons({ masterable: true })`

## Locale utilities

Import locale helpers from `@tenno-companion/core/locales`:

```ts
import {
  sortByName,
  getDictionaries,
  SUPPORTED_LANGUAGES,
} from '@tenno-companion/core/locales'
```

- `sortByName(items, { locale })` — locale-aware name sorting
- `getDictionaries(locale)` — loads dictionary JSON for supported locales
- `SUPPORTED_LANGUAGES` — supported Warframe locale codes

## Build & test

From the repo root:

```bash
pnpm --filter @tenno-companion/core build
pnpm --filter @tenno-companion/core test
pnpm --filter @tenno-companion/core dev
```

## License

This package is licensed under MIT License. See [LICENSE](https://github.com/mateo-leal/tenno-companion/blob/main/LICENSE) for details.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/mateo-leal/tenno-companion/blob/main/CONTRIBUTING.md) for guidelines.

## Related Packages

- [@tenno-companion/kim](https://www.npmjs.com/package/@tenno-companion/kim) — KIM dialogue and chatroom data
