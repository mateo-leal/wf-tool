import { Intrinsic, PublicExportMap, IndexNameType, Region } from './types'

const EXPORT_INTRINSICS_URL =
  'https://browse.wf/warframe-public-export-plus/ExportIntrinsics.json'
const EXPORT_MISSION_TYPES_URL =
  'https://browse.wf/warframe-public-export-plus/ExportMissionTypes.json'
const EXPORT_REGIONS_URL =
  'https://browse.wf/warframe-public-export-plus/ExportRegions.json'
const EXPORT_FACTIONS_URL =
  'https://browse.wf/warframe-public-export-plus/ExportFactions.json'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'force-cache',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return (await response.json()) as T
}

// export function fetchPublicExportWeapons() {
//   return fetchJson<PublicExportMap<PublicExportWeapon>>(EXPORT_WEAPONS_URL)
// }

// export function fetchPublicExportWarframes() {
//   return fetchJson<PublicExportMap<PublicExportWarframe>>(EXPORT_WARFRAMES_URL)
// }

// export function fetchPublicExportSentinels() {
//   return fetchJson<PublicExportMap<PublicExportSentinel>>(EXPORT_SENTINELS_URL)
// }

export function fetchPublicExportIntrinsics() {
  return fetchJson<PublicExportMap<Intrinsic>>(EXPORT_INTRINSICS_URL)
}

export function fetchPublicExportMissionTypes() {
  return fetchJson<PublicExportMap<IndexNameType>>(EXPORT_MISSION_TYPES_URL)
}

export function fetchPublicExportRegions() {
  return fetchJson<PublicExportMap<Region>>(EXPORT_REGIONS_URL)
}

export function fetchPublicExportFactions() {
  return fetchJson<PublicExportMap<IndexNameType>>(EXPORT_FACTIONS_URL)
}
