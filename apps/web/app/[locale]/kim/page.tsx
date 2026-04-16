import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/kim'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'kim.metadata' })

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: locale === 'en' ? '/kim' : `/${locale}/kim`,
    },
    twitter: {
      card: 'summary',
      title: t('title'),
      description: t('description'),
    },
  }
}

export default function Page() {
  return null
}
