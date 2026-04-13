import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Counter } from '../types'
import { type _Translator } from 'next-intl'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}

export function toTitleCase(str: string) {
  return str.replace(
    /[^\s\-]+/g,
    (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
  )
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function counterToString(
  counter: Counter,
  t: _Translator,
  options: { showSeconds?: boolean } = { showSeconds: true }
) {
  const { days, hours, minutes, seconds } = counter
  const parts = []
  if (days > 0) parts.push(t('ui.counter.days', { days }))
  if (hours > 0) parts.push(t('ui.counter.hours', { hours }))
  if (minutes > 0) parts.push(t('ui.counter.minutes', { minutes }))
  if (days === 0 && hours === 0 && options.showSeconds && seconds >= 0)
    parts.push(t('ui.counter.seconds', { seconds }))
  return parts.join(' ')
}
