import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { ButtonHTMLAttributes } from 'react'

const buttonVariants = cva(
  'border px-2 py-1 transition text-foreground inline-flex items-center justify-center gap-1',
  {
    variants: {
      variant: {
        default:
          'border-success-border bg-success-bg text-success hover:bg-success-hover',
        outline:
          'border-muted-primary bg-transparent hover:bg-muted-primary/30',
        secondary:
          'border-muted-primary bg-secondary-bg text-primary hover:bg-secondary-bg-hover',
        destructive:
          'border-error-border bg-error-bg text-error hover:bg-error-bg/30',
        ghost: 'border-transparent bg-transparent hover:bg-muted-primary/30',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'px-3 py-2 font-title text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      type="button"
      {...props}
    />
  )
}
