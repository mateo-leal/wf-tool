import { execSync } from 'child_process'
import { BRANCH, OWNER, REPO } from './get-sources-url'
import fs from 'fs'
import path from 'path'
import { checkGitHubUpdate } from '@tenno-companion/shared/utilities'

const SHA_FILE = path.join(__dirname, '../data/commit-sha')

const changesetContent = (latestSHA: string) => `---
"@tenno-companion/kim": patch
---

Automated data sync with ${REPO} (${latestSHA.slice(0, 7)})
`

async function run() {
  console.log('Checking for source updates...')

  const { isUpdateAvailable, latestSHA } = await checkGitHubUpdate({
    owner: OWNER,
    repo: REPO,
    branch: BRANCH,
    commitHash: fs.existsSync(SHA_FILE)
      ? fs.readFileSync(SHA_FILE, 'utf8').trim()
      : '',
  })

  if (!isUpdateAvailable) {
    console.log('Data is already up to date.')
    return
  }

  console.log(`New update detected: ${latestSHA.slice(0, 7)}`)

  try {
    console.log('Fetching new data...')
    execSync('npm run fetch-data', { stdio: 'inherit' })

    fs.writeFileSync(SHA_FILE, latestSHA)

    const changesetPath = path.join(
      __dirname,
      `../../../.changeset/auto-update-${Date.now()}.md`
    )

    if (!fs.existsSync(path.dirname(changesetPath))) {
      fs.mkdirSync(path.dirname(changesetPath), { recursive: true })
    }
    fs.writeFileSync(changesetPath, changesetContent(latestSHA))

    console.log('Bumping version...')
    execSync('pnpm changeset version', { stdio: 'inherit' })

    console.log('Update prepared successfully.')
    process.exit(1)
  } catch (error) {
    console.error(
      'Update failed. SHA file not updated, will retry on next run.',
      error
    )
    process.exit(0)
  }
}

run()
