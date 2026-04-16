import { cn } from '@/lib/utils'
import { PropsWithChildren } from 'react'

export function Window({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'border-2 border-muted-primary bg-background shadow-(--window-shadow) animate-window',
        'flex flex-col w-full',
        className
      )}
    >
      {children}
    </div>
  )
}
