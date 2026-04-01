import type { Metadata } from 'next'
import { ChatWindow } from '@/components/windows/chat'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/chatrooms'
import { capitalizeFirstLetter } from '@/lib/utils'
import { routing } from '@/i18n/routing'
import { setRequestLocale } from 'next-intl/server'

export async function generateStaticParams() {
  const locales = routing.locales.map((locale) => ({ locale }))
  const chatrooms = Object.keys(CHATROOM_SOURCE_BY_ID).map((id) => ({
    chatroom: id,
  }))
  return locales.flatMap((locale) =>
    chatrooms.map((chatroom) => ({ ...locale, ...chatroom }))
  )
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/kim/[chatroom]'>): Promise<Metadata> {
  const { chatroom, locale } = await params

  const source = CHATROOM_SOURCE_BY_ID[chatroom]

  if (!source) {
    return {
      title: 'Chatroom Not Found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const chatroomName = capitalizeFirstLetter(chatroom.replace('-', ' '))

  return {
    title: `${chatroomName} KIM Dialogue`,
    description: `Simulate and analyze ${chatroomName} KIM dialogue paths with chemistry, thermostat, and boolean state outcomes.`,
    alternates: {
      canonical: `/kim/${chatroom}`,
    },
    openGraph: {
      title: `${chatroomName} KIM Dialogue`,
      description: `Simulate and analyze ${chatroomName} KIM dialogue paths with chemistry, thermostat, and boolean state outcomes.`,
      url: `/kim/${chatroom}`,
    },
  }
}

export default async function Page({
  params,
}: PageProps<'/[locale]/kim/[chatroom]'>) {
  const { chatroom, locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return <ChatWindow chatroom={chatroom} />
}
