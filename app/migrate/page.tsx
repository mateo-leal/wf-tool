'use client'

/**
 * Migration source page — served on the OLD domain (wf-tool.ml-link.cc).
 *
 * This route remains as a compatibility entrypoint.  When opened on the old
 * domain it reads all wf-kim localStorage keys, encodes them in the hash, and
 * redirects to the new domain.
 */

import { useEffect } from 'react'
import { ALL_MIGRATION_KEYS } from '@/lib/constants'

const OLD_DOMAIN_HOSTNAME = 'wf-tool.ml-link.cc'
const NEW_DOMAIN_ORIGIN = 'https://tennocompanion.com'
const MIGRATION_HASH_KEY = 'wf-kim-migration'

export default function MigratePage() {
  useEffect(() => {
    if (window.location.hostname !== OLD_DOMAIN_HOSTNAME) {
      window.location.replace(NEW_DOMAIN_ORIGIN)
      return
    }

    const data: Record<string, string> = {}
    for (const key of ALL_MIGRATION_KEYS) {
      try {
        const value = localStorage.getItem(key)
        if (value !== null) {
          data[key] = value
        }
      } catch {
        // Ignore storage errors (e.g. private browsing with strict settings).
      }
    }

    const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
    const destination = new URL(NEW_DOMAIN_ORIGIN)
    destination.hash = `${MIGRATION_HASH_KEY}=${encoded}`

    window.location.replace(destination.toString())
  }, [])

  return (
    <p className="p-4 text-sm text-foreground">
      Redirecting to the new site&hellip;
    </p>
  )
}
