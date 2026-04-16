import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { MasteryChecklistWindow } from '@/components/windows/mastery-checklist'

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/mastery'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'masteryChecklist.metadata',
  })

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: locale === 'en' ? '/mastery' : `/${locale}/mastery`,
    },
    twitter: {
      card: 'summary',
      title: t('title'),
      description: t('description'),
    },
  }
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
