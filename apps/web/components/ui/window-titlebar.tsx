import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

export function WindowTitlebar({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-1 px-2',
        // 'border-b border-muted-primary',
        'bg-linear-to-b from-[#590600] to-[#390200]',
        'text-primary font-title text-xl tracking-wide',
        className
      )}
    >
      {children}
    </div>
  )
}
