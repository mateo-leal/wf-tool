import fs from 'fs'
import path from 'path'
import { SUPPORTED_LANGUAGES } from '../src/lib/locales'

const BASE_URL =
  'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/refs/heads/senpai/'

const SOURCES = {
  factions: 'ExportFactions',
  missionTypes: 'ExportMissionTypes',
  railjackIntrinsics: 'ExportIntrinsics',
  regions: 'ExportRegions',
  sentinels: 'ExportSentinels',
  warframes: 'ExportWarframes',
  weapons: 'ExportWeapons',
}

function collectKeys(obj: any, keys: Set<string>) {
  if (!obj || typeof obj !== 'object') return
  for (const value of Object.values(obj)) {
    if (typeof value === 'string' && value.startsWith('/Lotus/Language')) {
      keys.add(value)
    } else if (typeof value === 'object') {
      collectKeys(value, keys)
    }
  }
}

async function updateData() {
  const allKeys = new Set<string>()
  const statsDir = path.join(__dirname, '../data/stats')
  const dictsDir = path.join(__dirname, '../data/dicts')

  // Ensure directories exist
  ;[statsDir, dictsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })

  console.log('--- Fetching Stats ---')
  for (const [name, fileName] of Object.entries(SOURCES)) {
    const response = await fetch(`${BASE_URL}${fileName}.json`)
    const data = await response.json()

    // Collect all translation keys used in these items
    collectKeys(data, allKeys)

    fs.writeFileSync(
      path.join(statsDir, `${name}.json`),
      JSON.stringify(data, null, 2)
    )
    console.log(`✅ Saved stats for ${name}`)
  }

  console.log('\n--- Fetching & Filtering Dictionaries ---')
  console.log(`Found ${allKeys.size} unique translation keys.`)

  for (const locale of Object.keys(SUPPORTED_LANGUAGES)) {
    try {
      const response = await fetch(`${BASE_URL}dict.${locale}.json`)
      const fullDict = await response.json()

      // FILTERING: Only keep keys that exist in our stats
      const filteredDict: Record<string, string> = {}
      allKeys.forEach((key) => {
        if (fullDict[key]) {
          filteredDict[key] = fullDict[key]
        }
      })

      fs.writeFileSync(
        path.join(dictsDir, `${locale}.json`),
        JSON.stringify(filteredDict, null, 2)
      )
      console.log(
        `✅ Minified dictionary for ${locale} (${Object.keys(filteredDict).length} strings)`
      )
    } catch (error) {
      console.error(`❌ Failed to process ${locale}:`, error)
    }
  }
}

updateData()
