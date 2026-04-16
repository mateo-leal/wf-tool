import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

export function WindowContent({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col p-2',
        'border-t border-muted-primary bg-background',
        'window-content-effect',
        className
      )}
    >
      {children}
    </div>
  )
}
