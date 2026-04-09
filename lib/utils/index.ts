import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
