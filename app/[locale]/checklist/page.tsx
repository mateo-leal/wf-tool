import { ChecklistWindow } from '@/components/windows/checklist'
import { setRequestLocale } from 'next-intl/server'

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
