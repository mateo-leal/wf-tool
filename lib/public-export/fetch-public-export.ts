export type PublicExportWeapon = {
  name?: string
  icon?: string
  productCategory?: string
  masteryReq?: number
  partType?: string
  maxLevelCap?: number
}

export type PublicExportWarframe = {
  name?: string
  icon?: string
  productCategory?: string
  masteryReq?: number
}

export type PublicExportSentinel = {
  name?: string
  icon?: string
  productCategory?: string
  masteryReq?: number
}

export type PublicExportIntrinsicRank = {
  name?: string
  description?: string
}

export type PublicExportIntrinsic = {
  name?: string
  description?: string
  icon?: string
  ranks?: PublicExportIntrinsicRank[]
}

export type PublicExportMap<T> = Record<string, T>

const EXPORT_WEAPONS_URL =
  // using github for now since browse.wf is outdated and doesn't have the latest export, but ideally we should switch back to browse.wf once it's updated
  // 'https://browse.wf/warframe-public-export-plus/ExportWeapons.json'
  'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/refs/heads/senpai/ExportWeapons.json'
const EXPORT_WARFRAMES_URL =
  // 'https://browse.wf/warframe-public-export-plus/ExportWarframes.json'
  'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/refs/heads/senpai/ExportWarframes.json'
const EXPORT_SENTINELS_URL =
  'https://browse.wf/warframe-public-export-plus/ExportSentinels.json'
const EXPORT_INTRINSICS_URL =
  'https://browse.wf/warframe-public-export-plus/ExportIntrinsics.json'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'force-cache',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return (await response.json()) as T
}

export function fetchPublicExportWeapons() {
  return fetchJson<PublicExportMap<PublicExportWeapon>>(EXPORT_WEAPONS_URL)
}

export function fetchPublicExportWarframes() {
  return fetchJson<PublicExportMap<PublicExportWarframe>>(EXPORT_WARFRAMES_URL)
}

export function fetchPublicExportSentinels() {
  return fetchJson<PublicExportMap<PublicExportSentinel>>(EXPORT_SENTINELS_URL)
}

export function fetchPublicExportIntrinsics() {
  return fetchJson<PublicExportMap<PublicExportIntrinsic>>(
    EXPORT_INTRINSICS_URL
  )
}
