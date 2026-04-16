import { ChecklistWindow } from '@/components/windows/checklist'
import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/checklist'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'checklist.metadata' })

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: locale === 'en' ? '/checklist' : `/${locale}/checklist`,
    },
    twitter: {
      card: 'summary',
      title: t('title'),
      description: t('description'),
    },
  }
}

export default async function Page({
  params,
}: PageProps<'/[locale]/checklist'>) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
      <div className="flex min-h-full flex-col gap-2 md:block">
        <ChecklistWindow />
      </div>
    </div>
  )
}
