import { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { MasteryChecklistWindow } from '@/components/windows/mastery-checklist'

export const revalidate = 3600 // Revalidate every hour

export const metadata: Metadata = {
  title: 'Mastery Checklist',
  description:
    'Track your Warframe Mastery Rank progress by logging domained weapons, frames, companions, and intrinsics so you always know what to level next.',
  alternates: {
    canonical: '/mastery',
  },
  openGraph: {
    title: 'Mastery Checklist',
    description:
      'Track your Warframe Mastery Rank progress by logging domained weapons, frames, companions, and intrinsics so you always know what to level next.',
    url: '/mastery',
  },
}

export default async function Page({ params }: PageProps<'/[locale]/mastery'>) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
      <div className="flex min-h-full flex-col gap-2 md:block">
        <MasteryChecklistWindow />
      </div>
    </div>
  )
}
