'use client'

import { KimWindow } from '@/components/windows/kim'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: LayoutProps<'/[locale]/kim'>) {
  const pathname = usePathname()
  const isKimHome = pathname === '/kim'

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
      <div className="flex min-h-full flex-col gap-2 md:block">
        <div className={isKimHome ? undefined : 'hidden md:block'}>
          <KimWindow />
        </div>
        {children}
      </div>
    </div>
  )
}
