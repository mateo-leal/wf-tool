import { useTranslations } from 'next-intl'

export function SimulationLoadingState() {
  const t = useTranslations('kim.chatroom')
  return (
    <div className="p-4">
      <div className="flex flex-col items-center gap-3 py-8">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#8f5d1f] border-t-[#f0bb5f]" />
        <p className="text-sm text-[#d8ccb5]">{t('simulateLoading')}</p>
      </div>
    </div>
  )
}
