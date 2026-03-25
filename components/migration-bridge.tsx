'use client'

/**
 * MigrationBridge — runs on both old and new domains.
 *
 * If the user lands on the OLD domain (wf-tool.ml-link.cc), this component
 * reads localStorage, encodes all migration keys in a hash token, and
 * redirects to the equivalent path on the NEW domain (tennocompanion.com).
 *
 * On the NEW domain, if the hash contains `wf-kim-migration=<base64>`, it
 * decodes and stores the values client-side, marks migration as done, and
 * removes the migration token from the URL.
 */

import { useEffect } from 'react'
import { ALL_MIGRATION_KEYS, MIGRATION_DONE_KEY } from '@/lib/constants'

const OLD_HOSTNAME = 'wf-tool.ml-link.cc'
const NEW_HOSTNAME = 'tennocompanion.com'
const NEW_ORIGIN = 'https://tennocompanion.com'
const MIGRATION_HASH_KEY = 'wf-kim-migration'

const ALLOWED_KEYS = new Set<string>(ALL_MIGRATION_KEYS)

export function MigrationBridge() {
  useEffect(() => {
    const { hostname, pathname, search } = window.location

    if (hostname === OLD_HOSTNAME) {
      const data: Record<string, string> = {}
      for (const key of ALL_MIGRATION_KEYS) {
        try {
          const value = localStorage.getItem(key)
          if (value !== null) {
            data[key] = value
          }
        } catch {
          // Ignore storage errors and continue redirecting.
        }
      }

      const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
      const destination = new URL(NEW_ORIGIN)
      destination.pathname = pathname === '/migrate' ? '/' : pathname
      destination.search = search
      destination.hash = `${MIGRATION_HASH_KEY}=${encoded}`
      window.location.replace(destination.toString())
      return
    }

    if (hostname !== NEW_HOSTNAME) return

    try {
      // If we're already migrated and there is no incoming token, do nothing.
      if (
        localStorage.getItem(MIGRATION_DONE_KEY) === '1' &&
        !window.location.hash.includes(MIGRATION_HASH_KEY)
      ) {
        return
      }
    } catch {
      // Can't access localStorage — skip.
      return
    }

    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const migrationToken = hashParams.get(MIGRATION_HASH_KEY)

    if (migrationToken !== null) {
      // Decode and import data from old domain.
      try {
        const parsed = JSON.parse(
          decodeURIComponent(atob(migrationToken))
        ) as unknown

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          for (const [key, value] of Object.entries(
            parsed as Record<string, unknown>
          )) {
            // Write only known keys coming from the old domain.
            if (ALLOWED_KEYS.has(key) && typeof value === 'string') {
              localStorage.setItem(key, value)
            }
          }
        }
      } catch {
        // Ignore decode / parse / storage errors.
      }

      // Mark done regardless of whether there was any data to import.
      try {
        localStorage.setItem(MIGRATION_DONE_KEY, '1')
      } catch {
        // ignore
      }

      // Remove the migration token from the hash so it doesn't linger in the URL.
      hashParams.delete(MIGRATION_HASH_KEY)
      const remaining = hashParams.toString()
      window.history.replaceState(
        null,
        '',
        window.location.pathname +
          window.location.search +
          (remaining ? '#' + remaining : '')
      )

      return
    }
  }, [])

  return null
}
