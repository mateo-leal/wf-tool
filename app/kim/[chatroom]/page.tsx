import type { Metadata } from 'next'
import { ChatWindow } from '@/components/windows/chat'
import { CHATROOM_SOURCE_BY_ID } from '@/lib/chatrooms'
import { capitalizeFirstLetter } from '@/lib/utils'

export async function generateStaticParams() {
  return Object.keys(CHATROOM_SOURCE_BY_ID).map((id) => ({ chatroom: id }))
}

export async function generateMetadata({
  params,
}: PageProps<'/kim/[chatroom]'>): Promise<Metadata> {
  const { chatroom } = await params

  return {
    title: `${capitalizeFirstLetter(chatroom)} | KIM Pathfinder`,
  }
}

export default async function Page({ params }: PageProps<'/kim/[chatroom]'>) {
  const { chatroom } = await params

  return <ChatWindow chatroom={chatroom} />
}
