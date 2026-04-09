import { ChecklistTask } from './types'

export const DAILY_TASKS: ChecklistTask[] = [
  {
    id: 'daily-login-reward',
    title: 'checklist.daily.tasks.login',
  },
  {
    id: 'daily-forma',
    title: 'checklist.daily.tasks.craftForma',
    location: 'locations.baseOfOperations',
    terminal: 'terminal.foundry',
  },
  {
    id: 'daily-other-foundry',
    title: 'checklist.daily.tasks.craftOther',
    location: 'locations.baseOfOperations',
    terminal: 'terminal.foundry',
  },
  {
    id: 'daily-syndicate-standing',
    title: 'checklist.daily.tasks.factionSyndicates',
    info: 'checklist.daily.tasks.factionSyndicatesInfo',
  },
  {
    id: 'daily-arbitration',
    title: {
      key: '/Lotus/Language/Menu/AlertHardMode',
      source: 'oracle',
    },
    location: 'locations.baseOfOperations',
    terminal: 'terminal.navigation',
    prerequisite: {
      key: '/Lotus/Language/Locations/ErisJunction',
    },
  },
  {
    id: 'daily-nightwave',
    title: { key: '/Lotus/Language/Syndicates/RadioLegionTitle' },
    info: 'checklist.daily.tasks.nightwaveInfo',
    location: 'locations.baseOfOperations',
    terminal: { key: '/Lotus/Language/Items/NoraShipName' },
  },
  {
    id: 'daily-world-syndicates',
    title: 'checklist.daily.tasks.worldSyndicates',
    checkable: false,
    subitems: [
      {
        id: 'daily-world-simaris',
        title: { key: '/Lotus/Language/Syndicates/LibraryTitle' },
        location: 'locations.anyRelay',
      },
      {
        id: 'daily-world-ostron',
        title: { key: '/Lotus/Language/Syndicates/CetusName' },
        location: [
          { key: '/Lotus/Language/Locations/CetusHub' },
          { key: '/Lotus/Language/Locations/Earth' },
        ],
        prerequisite: {
          key: '/Lotus/Language/GlassQuest/GlassQuestTitle',
        },
      },
      {
        id: 'daily-world-quills',
        title: { key: '/Lotus/Language/Syndicates/QuillsName' },
        location: [
          { key: '/Lotus/Language/Locations/CetusHub' },
          { key: '/Lotus/Language/Locations/Earth' },
        ],
        prerequisite: {
          key: '/Lotus/Language/G1Quests/WarWithinQuestName',
        },
      },
      {
        id: 'daily-world-solaris-united',
        title: { key: '/Lotus/Language/Syndicates/SolarisSecretName' },
        location: [
          { key: '/Lotus/Language/Locations/SolarisUnitedHub' },
          { key: '/Lotus/Language/Locations/Venus' },
        ],
        prerequisite: {
          key: '/Lotus/Language/SolarisQuest/VoxSolarisKeyChainName',
        },
      },
      {
        id: 'daily-world-vox-solaris',
        title: { key: '/Lotus/Language/Syndicates/VoxSolName' },
        location: [
          { key: '/Lotus/Language/Locations/SolarisUnitedHub' },
          { key: '/Lotus/Language/Locations/Venus' },
        ],
        prerequisite: {
          key: '/Lotus/Language/G1Quests/WarWithinQuestName',
        },
      },
      {
        id: 'daily-world-ventkids',
        title: { key: '/Lotus/Language/Syndicates/VentkidsName' },
        location: [
          { key: '/Lotus/Language/Locations/SolarisUnitedHub' },
          { key: '/Lotus/Language/Locations/Venus' },
        ],
        prerequisite: {
          key: '/Lotus/Language/SolarisQuest/VoxSolarisKeyChainName',
        },
      },
      {
        id: 'daily-world-entrati',
        title: {
          key: '/Lotus/Language/InfestedMicroplanet/EntratiSyndicateName',
        },
        location: [
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosHubName' },
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
        ],
        prerequisite: {
          key: '/Lotus/Language/InfestedMicroplanetQuest/QuestName',
        },
      },
      {
        id: 'daily-world-necraloid',
        title: {
          key: '/Lotus/Language/InfestedMicroplanet/NecraloidSyndicateName',
        },
        location: [
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosHubName' },
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
        ],
        prerequisite: {
          key: '/Lotus/Language/G1Quests/WarWithinQuestName',
        },
      },
      {
        id: 'daily-world-holdfasts',
        title: { key: '/Lotus/Language/Syndicates/ZarimanName' },
        location: [
          { key: '/Lotus/Language/Zariman/ZarimanHubName' },
          { key: '/Lotus/Language/Zariman/ZarimanRegionName' },
        ],
        prerequisite: {
          key: '/Lotus/Language/ZarimanQuest/ZQName',
        },
      },
      {
        id: 'daily-world-cavia',
        title: {
          key: '/Lotus/Language/EntratiLab/EntratiGeneral/EntratiLabSyndicateName',
        },
        location: [
          { key: '/Lotus/Language/Entrati/SolarMapEntratiLabsShortcut' },
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
        ],
        prerequisite: {
          key: '/Lotus/Language/EntratiLab/EntratiQuest/EntratiQuestTitle',
        },
      },
      {
        id: 'daily-world-hex',
        title: { key: '/Lotus/Language/1999/MessengerHexName' },
        location: [{ key: '/Lotus/Language/1999/1999HubName' }],
        prerequisite: {
          key: '/Lotus/Language/1999Quest/QuestTitle',
        },
      },
    ],
  },
  {
    id: 'daily-sortie',
    title: {
      key: '/Lotus/Language/Menu/SortieMissionName',
      source: 'oracle',
    },
    info: 'checklist.daily.tasks.sortieInfo',
    location: 'locations.baseOfOperations',
    terminal: 'terminal.navigation',
    prerequisite: {
      key: '/Lotus/Language/G1Quests/WarWithinQuestName',
    },
  },
  {
    id: 'daily-focus',
    title: 'checklist.daily.tasks.focus',
    info: 'checklist.daily.tasks.focusInfo',
    prerequisite: {
      key: '/Lotus/Language/G1Quests/SecondDreamKeychain',
    },
  },
  {
    id: 'daily-vendors',
    title: 'checklist.daily.tasks.vendors',
    subitems: [
      {
        id: 'daily-vendor-acrithis',
        title: { key: '/Lotus/Language/Duviri/Acrithis' },
        info: 'checklist.daily.tasks.acrithisInfo',
        location: [
          { key: '/Lotus/Language/Zariman/ZarimanApartment' },
          { key: '/Lotus/Language/Zariman/ZarimanRegionName' },
        ],
        npc: { key: '/Lotus/Language/Duviri/Acrithis' },
      },
      {
        id: 'daily-vendor-ticker',
        title: 'npcs.ticker',
        info: 'checklist.daily.tasks.tickerInfo',
        location: [
          { key: '/Lotus/Language/Locations/SolarisUnitedHub' },
          { key: '/Lotus/Language/Locations/Venus' },
        ],
        npc: 'npcs.ticker',
        prerequisite: {
          key: '/Lotus/Language/G1Quests/RailjackBuildQuestName',
        },
      },
      {
        id: 'daily-vendor-marie',
        title: { key: '/Lotus/Language/CircleOfHell/MarieName' },
        info: 'checklist.daily.tasks.marieInfo',
        location: [
          { key: '/Lotus/Language/Entrati/SolarMapEntratiLabsShortcut' },
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
        ],
        npc: { key: '/Lotus/Language/CircleOfHell/MarieName' },
        prerequisite: {
          key: '/Lotus/Language/TauPrequel/TauPrequelFinal/TauPrequelQuestName',
        },
      },
    ],
  },
]

export const WEEKLY_TASKS: ChecklistTask[] = [
  {
    id: 'weekly-nightwave',
    title: { key: '/Lotus/Language/Syndicates/RadioLegionTitle' },
    info: 'checklist.weekly.tasks.nightwaveInfo',
    location: 'locations.baseOfOperations',
    terminal: { key: '/Lotus/Language/Items/NoraShipName' },
  },
  {
    id: 'weekly-maroo',
    title: { key: '/Lotus/Language/G1Quests/TreasureHuntWeeklyObjective' },
    info: 'checklist.weekly.tasks.ayatanTreasureHuntInfo',
    location: [
      { key: '/Lotus/Language/Locations/RelayStationTrade' },
      { key: '/Lotus/Language/Locations/Mars' },
    ],
    npc: { key: '/Lotus/Language/Game/Maroo' },
  },
  {
    id: 'weekly-help-clem',
    title: {
      key: '/Lotus/Language/NightwaveChallenges/Challenge_SeasonWeeklyCompleteClemMission_Description',
    },
    location: 'locations.anyRelay',
    npc: { key: '/Lotus/Language/Game/DarvoName' },
    prerequisite: {
      key: '/Lotus/Language/G1Quests/GetClemName',
    },
  },
  {
    id: 'weekly-archon-hunt',
    title: {
      key: '/Lotus/Language/WorldStateWindow/LiteSortieMissionName',
      source: 'oracle',
    },
    info: 'checklist.weekly.tasks.archonHuntInfo',
    location: 'locations.baseOfOperations',
    terminal: 'terminal.navigation',
    prerequisite: {
      key: '/Lotus/Language/NewWar/NewWarQuestName',
    },
  },
  {
    id: 'weekly-circuit-normal',
    title: { key: '/Lotus/Language/Duviri/MapNodeEndless' },
    info: 'checklist.weekly.tasks.circuitInfo',
    location: 'locations.baseOfOperations',
    terminal: 'terminal.navigation',
    prerequisite: {
      key: '/Lotus/Language/Duviri/MapNodeQuest',
    },
  },
  {
    id: 'weekly-circuit-sp',
    title: { key: '/Lotus/Language/Duviri/MapNodeEndless' },
    info: 'checklist.weekly.tasks.circuitSPInfo',
    steelPath: true,
    location: 'locations.baseOfOperations',
    terminal: 'terminal.navigation',
    prerequisite: {
      key: '/Lotus/Language/Duviri/MapNodeQuest',
    },
  },
  {
    id: 'weekly-search-pulses',
    title: 'checklist.weekly.tasks.searchPulses',
    info: 'checklist.weekly.tasks.searchPulsesInfo',
    subitems: [
      {
        id: 'weekly-search-pulses-netracells',
        title: {
          key: '/Lotus/Language/EntratiLab/EntratiQuest/StageSixVoidVaults',
        },
        info: 'checklist.weekly.tasks.netracellsInfo',
        location: [
          { key: '/Lotus/Language/Entrati/SolarMapEntratiLabsShortcut' },
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
        ],
        npc: 'npcs.tagfer',
        prerequisite: {
          key: '/Lotus/Language/EntratiLab/EntratiQuest/EntratiQuestTitle',
        },
      },
      {
        id: 'weekly-search-pulses-deep-archimedea',
        title: {
          key: '/Lotus/Language/Conquest/SolarMapLabConquestNode',
          source: 'oracle',
        },
        info: 'checklist.weekly.tasks.eliteDeepArchimedeaInfo',
        location: [
          { key: '/Lotus/Language/Entrati/SolarMapEntratiLabsShortcut' },
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
        ],
        npc: { key: '/Lotus/Language/Bosses/Necraloid' },
        syndicateRank: {
          syndicate: {
            key: '/Lotus/Language/EntratiLab/EntratiGeneral/EntratiLabSyndicateName',
          },
          rank: 5,
        },
      },
      {
        id: 'weekly-search-pulses-temporal-archimedea',
        title: {
          key: '/Lotus/Language/1999Echoes/1999HexConquestNode',
          source: 'oracle',
        },
        info: 'checklist.weekly.tasks.eliteTemporalArchimedeaInfo',
        location: [{ key: '/Lotus/Language/1999/1999HubName' }],
        npc: 'npcs.kaya',
        syndicateRank: {
          syndicate: { key: '/Lotus/Language/1999/MessengerHexName' },
          rank: 5,
        },
      },
    ],
  },
  {
    id: 'weekly-1999-calendar',
    title: 'checklist.weekly.tasks.the1999Calendar',
    info: 'checklist.weekly.tasks.the1999CalendarInfo',
    location: 'locations.baseOfOperations',
    terminal: 'terminal.pom2pc',
    prerequisite: {
      key: '/Lotus/Language/1999Quest/QuestTitle',
    },
  },
  {
    id: 'weekly-helminth',
    title: 'checklist.weekly.tasks.helminth',
    info: 'checklist.weekly.tasks.helminthInfo',
    location: 'locations.baseOfOperations',
    terminal: 'terminal.helminth',
    syndicateRank: {
      syndicate: {
        key: '/Lotus/Language/InfestedMicroplanet/EntratiSyndicateName',
      },
      rank: 5,
    },
  },
  {
    id: 'weekly-descendia',
    title: { key: '/Lotus/Language/Missions/MissionName_Descent' },
    info: 'checklist.weekly.tasks.descendiaInfo',
    location: [{ key: '/Lotus/Language/TauPrequel/TauPrequelFinal/TauRegion' }],
    terminal: 'terminal.navigation',
    prerequisite: {
      key: '/Lotus/Language/TauPrequel/TauPrequelFinal/TauPrequelQuestName',
    },
  },
  {
    id: 'weekly-descendia-steel-path',
    title: { key: '/Lotus/Language/Missions/MissionName_Descent' },
    info: 'checklist.weekly.tasks.descendiaInfo',
    steelPath: true,
    location: [{ key: '/Lotus/Language/TauPrequel/TauPrequelFinal/TauRegion' }],
    terminal: 'terminal.navigation',
    prerequisite: {
      key: '/Lotus/Language/TauPrequel/TauPrequelFinal/TauPrequelQuestName',
    },
  },
  {
    id: 'weekly-vendors',
    title: 'checklist.weekly.tasks.vendors',
    subitems: [
      {
        id: 'weekly-vendor-paladino',
        title: 'npcs.paladino',
        info: 'checklist.weekly.tasks.paladinoInfo',
        location: 'locations.ironWake',
        npc: 'npcs.paladino',
        prerequisite: {
          key: '/Lotus/Language/Quests/PriestQuestName',
        },
      },
      {
        id: 'weekly-vendor-yonta',
        title: 'npcs.yonta',
        info: 'checklist.weekly.tasks.yontaInfo',
        location: [
          { key: '/Lotus/Language/Zariman/ZarimanHubName' },
          { key: '/Lotus/Language/Zariman/ZarimanRegionName' },
        ],
        npc: 'npcs.yonta',
        prerequisite: {
          key: '/Lotus/Language/ZarimanQuest/ZQName',
        },
      },
      {
        id: 'weekly-vendor-acrithis',
        title: { key: '/Lotus/Language/Duviri/Acrithis' },
        info: 'checklist.weekly.tasks.acrithisInfo',
        location: [
          { key: '/Lotus/Language/Zariman/ZarimanApartment' },
          { key: '/Lotus/Language/Zariman/ZarimanRegionName' },
        ],
        npc: { key: '/Lotus/Language/Duviri/Acrithis' },
        prerequisite: {
          key: '/Lotus/Language/Duviri/MapNodeQuest',
        },
      },
      {
        id: 'weekly-vendor-teshin',
        title: { key: '/Lotus/Language/Game/Teshin' },
        info: 'checklist.weekly.tasks.teshinInfo',
        location: 'locations.anyRelay',
        npc: { key: '/Lotus/Language/Game/Teshin' },
        prerequisite: 'prerequisites.steelPath',
      },
      {
        id: 'weekly-vendor-bird3',
        title: 'npcs.bird3',
        info: 'checklist.weekly.tasks.bird3Info',
        location: [
          { key: '/Lotus/Language/Entrati/SolarMapEntratiLabsShortcut' },
          { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
        ],
        npc: 'npcs.bird3',
        syndicateRank: {
          syndicate: {
            key: '/Lotus/Language/EntratiLab/EntratiGeneral/EntratiLabSyndicateName',
          },
          rank: 5,
        },
      },
      {
        id: 'weekly-vendor-nightcap',
        title: { key: '/Lotus/Language/NokkoColony/NokkoVendorName' },
        info: 'checklist.weekly.tasks.nightcapInfo',
        location: [
          { key: '/Lotus/Language/Locations/SolarisUnitedHub' },
          { key: '/Lotus/Language/Locations/Venus' },
        ],
        npc: { key: '/Lotus/Language/NokkoColony/NokkoVendorName' },
        prerequisite: {
          key: '/Lotus/Language/NewWar/NewWarQuestName',
        },
      },
    ],
  },
]

export const OTHER_TASKS: ChecklistTask[] = [
  {
    id: 'other-baro',
    title: { key: '/Lotus/Language/G1Quests/VoidTraderName' },
    info: 'checklist.other.tasks.baroInfo',
    npc: { key: '/Lotus/Language/G1Quests/VoidTraderName' },
    resets: 'baro',
  },
  {
    id: 'other-entrati-tokens',
    title: 'checklist.other.tasks.entratiTokens',
    info: 'checklist.other.tasks.entratiTokensInfo',
    location: [
      { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosHubName' },
      { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
    ],
    npc: { key: '/Lotus/Language/Bosses/DeimosGrandmother' },
    prerequisite: {
      key: '/Lotus/Language/InfestedMicroplanetQuest/QuestName',
    },
    resets: 'eightHours',
  },
  {
    id: 'other-voidplume-trade',
    title: 'checklist.other.tasks.voidplumeTrade',
    location: [
      { key: '/Lotus/Language/Zariman/ZarimanHubName' },
      { key: '/Lotus/Language/Zariman/ZarimanRegionName' },
    ],
    npc: 'npcs.yonta',
    prerequisite: {
      key: '/Lotus/Language/ZarimanQuest/ZQName',
    },
    resets: 'eightHours',
  },
  {
    id: 'other-voca-trade',
    title: 'checklist.other.tasks.vocaTrade',
    location: [
      { key: '/Lotus/Language/Entrati/SolarMapEntratiLabsShortcut' },
      { key: '/Lotus/Language/InfestedMicroplanet/SolarMapDeimosName' },
    ],
    npc: { key: '/Lotus/Language/EntratiLab/EntratiGeneral/HumanLoid' },
    prerequisite: {
      key: '/Lotus/Language/EntratiLab/EntratiQuest/EntratiQuestTitle',
    },
    resets: 'eightHours',
  },
]
