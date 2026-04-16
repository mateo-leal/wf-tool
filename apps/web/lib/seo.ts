export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}

export function getSiteOrigin(): URL {
  return new URL(getSiteUrl())
}

export const APP_TITLE = 'Tenno Companion'
