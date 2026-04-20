import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { ChatWindow } from '@/components/windows/chat'
import { capitalizeFirstLetter } from '@/lib/utils'
import { CHATROOMS } from '@tenno-companion/kim/constants'
import { Chat } from '@tenno-companion/kim/server'
import { notFound } from 'next/navigation'
import { Chatroom } from '@tenno-companion/kim/types'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/kim/[chatroom]'>): Promise<Metadata> {
  const { chatroom, locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'kim.metadata.chatroom',
  })

  if (!(CHATROOMS as readonly string[]).includes(chatroom)) {
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
  const chatrooms = CHATROOMS.map((id) => ({
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

  if (!(CHATROOMS as readonly string[]).includes(chatroom)) {
    notFound()
  }

  const chat = await Chat.create(chatroom as Chatroom, { locale })

  return <ChatWindow chat={chat} />
}
