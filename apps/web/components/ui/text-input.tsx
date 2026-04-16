import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      {...props}
      className={cn(
        'w-full border px-2 py-1.5 text-sm outline-none',
        'border-muted-primary bg-background focus:border-primary',
        'text-foreground placeholder:text-muted-foreground',
        props.className
      )}
    />
  )
}
