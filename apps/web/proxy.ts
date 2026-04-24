import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest } from 'next/server'
import LinkHeader from 'http-link-header'

const handleI18nRouting = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request)

  const linkHeader = response.headers.get('Link')
  if (linkHeader) {
    const link = LinkHeader.parse(linkHeader)
    link.refs = link.refs.map((ref) => {
      if (ref.hreflang === 'tc') {
        ref.hreflang = 'zh-TW'
      }
      return ref
    })
    response.headers.set('Link', link.toString())
  }

  return response
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
