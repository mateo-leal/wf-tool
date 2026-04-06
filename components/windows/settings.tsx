'use client'

import { CloseButton } from '@/components/close-button'
import { LANGUAGE_OPTIONS } from '@/lib/language'
import { createPortal } from 'react-dom'
import { Window } from '../ui/window'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'

type SettingsPortalProps = {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPortal({ isOpen, onClose }: SettingsPortalProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('settings')

  if (!isOpen) {
    return null
  }

  function onLanguageChange(value: string) {
    router.replace(pathname, { locale: value })
  }

  return createPortal(
    <section className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3">
      <Window className="pointer-events-auto w-full max-w-sm">
        <WindowTitlebar>
          <p>{t('title')}</p>
          <CloseButton onClick={onClose} />
        </WindowTitlebar>
        <WindowContent>
          <label
            htmlFor="global-language-selector"
            className="mb-1 block text-xs uppercase tracking-wide"
          >
            {t('language')}
          </label>
          <select
            id="global-language-selector"
            value={locale}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="w-full border border-muted-primary bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Link
            href="https://github.com/mateo-leal/wf-tool"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center border border-muted-primary bg-background px-2 py-1.5 text-sm transition hover:bg-muted-primary/10"
          >
            {t('githubRepository')}
          </Link>

          <section className="mt-4 border border-muted-primary/70 bg-background/50 p-2 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
              {t('about.title')}
            </p>
            <p>{t('about.description')}</p>
            <p className="mt-2">{t('about.legalDisclaimer')}</p>
            <p className="mt-2">
              {t.rich('about.browseWfCredits', {
                link: (chunks) => (
                  <a
                    href="https://browse.wf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </section>
        </WindowContent>
      </Window>
    </section>,
    document.body
  )
}
