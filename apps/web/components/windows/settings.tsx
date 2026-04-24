'use client'

import { metrics } from '@sentry/nextjs'
import { createPortal } from 'react-dom'
import { useLocale, useTranslations } from 'next-intl'

import { LANGUAGE_OPTIONS } from '@/lib/language'
import { CloseButton } from '@/components/close-button'
import { Link, usePathname, useRouter } from '@/i18n/navigation'

import { Window } from '../ui/window'
import { WindowContent } from '../ui/window-content'
import { WindowTitlebar } from '../ui/window-titlebar'

type SettingsPortalProps = {
  isOpen: boolean
  onCloseAction: () => void
}

export function SettingsPortal({ isOpen, onCloseAction }: SettingsPortalProps) {
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
          <h1>{t('title')}</h1>
          <CloseButton onClick={onCloseAction} />
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

          {locale !== 'es' ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Help us translate the app to your language. Volunteer on{' '}
              <a
                href="https://crowdin.com/project/tenno-companion"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  metrics.count('link.crowdin', 1, {
                    attributes: {
                      locale,
                    },
                  })
                }}
              >
                Crowdin
              </a>
              .
            </p>
          ) : null}

          <Link
            href="https://github.com/mateo-leal/tenno-companion"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-full items-center justify-center border border-muted-primary bg-background px-2 py-1.5 text-sm transition hover:bg-muted-primary/10"
          >
            {t('githubRepository')}
          </Link>

          <section className="mt-2 border border-muted-primary/70 p-2 text-xs text-muted-foreground">
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
          <section className="mt-2 border border-muted-primary/70 p-2 text-xs text-muted-foreground flex gap-2">
            <p className="font-semibold uppercase tracking-wide text-foreground">
              {t('about.version')}
            </p>
            <p>{process.env.version}</p>
          </section>
        </WindowContent>
      </Window>
    </section>,
    document.body
  )
}
