import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { ChatWindow } from '@/components/windows/chat'
import { capitalizeFirstLetter } from '@/lib/utils'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/kim/chatrooms'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/kim/[chatroom]'>): Promise<Metadata> {
  const { chatroom, locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'kim.metadata.chatroom',
  })

  const source = CHATROOM_SOURCE_BY_ID[chatroom]

  if (!source) {
    return {
      title: t('notFound'),
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const chatroomName = capitalizeFirstLetter(chatroom.replace('-', ' '))

  return {
    title: t('title', { chatroomName }),
    description: t('description', { chatroomName }),
    openGraph: {
      title: t('title', { chatroomName }),
      description: t('description', { chatroomName }),
      url: locale === 'en' ? `/kim/${chatroom}` : `/${locale}/kim/${chatroom}`,
    },
  }
}

export async function generateStaticParams() {
  const locales = routing.locales.map((locale) => ({ locale }))
  const chatrooms = Object.keys(CHATROOM_SOURCE_BY_ID).map((id) => ({
    chatroom: id,
  }))
  return locales.flatMap((locale) =>
    chatrooms.map((chatroom) => ({ ...locale, ...chatroom }))
  )
}

export default async function Page({
  params,
}: PageProps<'/[locale]/kim/[chatroom]'>) {
  const { chatroom, locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return <ChatWindow chatroom={chatroom} />
}
