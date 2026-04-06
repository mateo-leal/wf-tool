import { LANGUAGE_OPTIONS } from '@/lib/language'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: LANGUAGE_OPTIONS.map((option) => option.value),

  // Used when no locale matches
  defaultLocale: 'en',

  localePrefix: 'as-needed',
})
