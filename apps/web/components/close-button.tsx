'use client'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { XIcon } from '@phosphor-icons/react'

type CloseButtonBaseProps = {
  label?: string
  disabled?: boolean
}

type CloseButtonClickProps = CloseButtonBaseProps & {
  onClick: () => void
  href?: never
}

type CloseButtonLinkProps = CloseButtonBaseProps & {
  href: string
  onClick?: never
}

type CloseButtonProps = CloseButtonClickProps | CloseButtonLinkProps

const classes = cn(
  'inline-flex size-7 items-center justify-center px-1 text-sm leading-none',
  'border border-primary bg-accent text-primary hover:bg-accent-hover transition',
  'disabled:pointer-events-none disabled:opacity-60'
)

export function CloseButton(props: CloseButtonProps) {
  const ariaLabel = props.label || 'Close'

  if ('href' in props && typeof props.href === 'string') {
    if (props.disabled) {
      return (
        <button
          type="button"
          aria-label={ariaLabel}
          className={classes}
          disabled
        >
          <XIcon className="size-4" weight="bold" />
        </button>
      )
    }

    return (
      <Link href={props.href} aria-label={ariaLabel} className={classes}>
        <XIcon className="size-4" weight="bold" />
      </Link>
    )
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={props.onClick}
      className={classes}
      disabled={props.disabled}
    >
      <XIcon className="size-4" weight="bold" />
    </button>
  )
}
