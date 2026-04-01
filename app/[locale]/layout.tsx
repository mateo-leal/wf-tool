import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Cormorant_Garamond, Oxanium } from 'next/font/google'
import { Taskbar } from '@/components/taskbar'
import { MigrationBridge } from '@/components/migration-bridge'
import { getSiteOrigin } from '@/lib/seo'
import './globals.css'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

const oxanium = Oxanium({
  variable: '--font-ui-sans',
  subsets: ['latin'],
})

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-ui-title',
  weight: ['500', '700'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  applicationName: 'Warframe Tool',
  title: {
    default: 'Warframe Tool',
    template: '%s | Warframe Tool',
  },
  description:
    'Explore and simulate Warframe KIM dialogue paths with chemistry, thermostat, and boolean state tracking.',
  keywords: [
    'Warframe',
    'KIM',
    'dialogue pathfinder',
    'dialogue simulator',
    'kim pathfinder',
    'Warframe Tool',
    'Hex',
    'chatroom',
    'WF',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'Warframe Tool',
    description:
      'Explore and simulate Warframe KIM dialogue paths with chemistry, thermostat, and boolean state tracking.',
    url: '/',
    siteName: 'Warframe Tool',
    locale: 'en_US',
    images: [
      {
        url: '/favicon.ico',
        width: 256,
        height: 256,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Warframe Tool',
    description:
      'Explore and simulate Warframe KIM dialogue paths with chemistry, thermostat, and boolean state tracking.',
    images: ['/favicon.ico'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'games',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body
        className={`${oxanium.variable} ${cormorantGaramond.variable} antialiased`}
      >
        <div className="kim-background min-h-screen overflow-y-auto text-foreground md:h-screen md:overflow-hidden">
          <NextIntlClientProvider>
            <main className="mx-auto flex min-h-screen w-full max-w-325 flex-col overflow-y-auto p-2 sm:p-4 md:h-screen md:overflow-hidden">
              {children}

              <Taskbar />
            </main>
          </NextIntlClientProvider>
        </div>
        <Analytics />
        <MigrationBridge />
      </body>
    </html>
  )
}
