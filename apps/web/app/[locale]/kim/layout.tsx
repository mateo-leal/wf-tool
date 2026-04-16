import { KimWindow } from '@/components/windows/kim'

export default function Layout({ children }: LayoutProps<'/[locale]/kim'>) {
  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
      <div className="flex min-h-full flex-col gap-2 md:block">
        <KimWindow />
        {children}
      </div>
    </div>
  )
}
