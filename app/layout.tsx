import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Cormorant_Garamond, Oxanium } from 'next/font/google'
import { Taskbar } from '@/components/taskbar'
import './globals.css'

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
  title: {
    default: 'WF Tool',
    template: '%s | WF Tool',
  },
  description: 'In-game inspired dialogue interface for KIM conversations',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${oxanium.variable} ${cormorantGaramond.variable} antialiased`}
      >
        <div className="kim-background h-screen overflow-hidden text-[#ebdfbf]">
          <main className="mx-auto flex h-screen w-full max-w-325 flex-col overflow-hidden p-2 sm:p-4">
            {children}

            <Taskbar />
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
