'use client'

import Image from 'next/image'
import { MASTERY_CHECKLIST_STORAGE_KEY } from '@/lib/constants'
import {
  CATEGORY_ORDER,
  type MasteryCategory,
  type MasteryData,
} from '@/lib/mastery'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ListIcon } from '@phosphor-icons/react'

type MasteryProgress = Record<string, boolean>

function normalizeProgress(value: unknown): MasteryProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, checked]) => [key, Boolean(checked)])
  )
}

function loadProgress(): MasteryProgress {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = localStorage.getItem(MASTERY_CHECKLIST_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    return normalizeProgress(JSON.parse(raw))
  } catch {
    return {}
  }
}

function saveProgress(progress: MasteryProgress): void {
  try {
    localStorage.setItem(
      MASTERY_CHECKLIST_STORAGE_KEY,
      JSON.stringify(progress)
    )
  } catch {
    // ignore storage errors
  }
}

type MasteryPanelProps = {
  masteryData: MasteryData | null
  initialError?: string | null
}

export function MasteryPanel({
  masteryData,
  initialError = null,
}: MasteryPanelProps) {
  const t = useTranslations('masteryChecklist')
  const [activeCategory, setActiveCategory] =
    useState<MasteryCategory>('warframe')
  const [query, setQuery] = useState('')
  const [progress, setProgress] = useState<MasteryProgress>(() =>
    loadProgress()
  )
  const [error] = useState<string | null>(initialError)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredItems = useMemo(() => {
    const categoryItems = masteryData?.[activeCategory] ?? []
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return categoryItems
    }

    return categoryItems.filter((item) =>
      item.name.toLowerCase().includes(normalizedQuery)
    )
  }, [activeCategory, masteryData, query])

  const categoryStats = useMemo(() => {
    if (!masteryData) {
      return Object.fromEntries(
        CATEGORY_ORDER.map((category) => [category, { done: 0, total: 0 }])
      ) as Record<MasteryCategory, { done: number; total: number }>
    }

    return Object.fromEntries(
      CATEGORY_ORDER.map((category) => {
        const items = masteryData[category]
        const done = items.reduce(
          (count, item) => count + (progress[item.id] ? 1 : 0),
          0
        )

        return [category, { done, total: items.length }]
      })
    ) as Record<MasteryCategory, { done: number; total: number }>
  }, [masteryData, progress])

  function toggleItem(itemId: string) {
    setProgress((previous) => {
      const next = {
        ...previous,
        [itemId]: !previous[itemId],
      }

      saveProgress(next)
      return next
    })
  }

  function clearCategory() {
    if (!masteryData) {
      return
    }

    const ids = masteryData[activeCategory].map((item) => item.id)

    setProgress((previous) => {
      const next = { ...previous }
      for (const id of ids) {
        delete next[id]
      }

      saveProgress(next)
      return next
    })
  }

  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <aside
        className={[
          'fixed top-0 left-0 z-40 flex w-48 max-h-[calc(100vh-5.5rem)] flex-col overflow-y-auto border border-muted-primary bg-background md:static md:max-h-none',
          sidebarOpen ? 'block' : 'hidden md:flex',
        ].join(' ')}
      >
        {CATEGORY_ORDER.map((category) => {
          const stats = categoryStats[category]
          const isActive = activeCategory === category

          return (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category)
                setSidebarOpen(false)
              }}
              className={[
                'border-b border-muted-primary/40 px-2 py-2 text-left transition last:border-b-0',
                isActive
                  ? 'bg-success-bg text-success'
                  : 'text-foreground hover:bg-muted-primary/15',
              ].join(' ')}
            >
              <p className="text-sm leading-tight">
                {t(`categories.${category}`)}
              </p>
              <p className="text-xs opacity-60">
                {t('doneCount', { count: stats.done, total: stats.total })}
              </p>
            </button>
          )
        })}
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0 md:hidden border border-muted-primary bg-background p-1 text-foreground transition hover:bg-muted-primary/15"
            aria-label="Toggle categories sidebar"
          >
            <ListIcon size={20} />
          </button>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 border border-muted-primary bg-background px-2 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="button"
            onClick={clearCategory}
            className="shrink-0 border border-muted-primary bg-background px-2 py-1 text-sm text-foreground transition hover:bg-muted-primary/15"
          >
            {t('clearCategory')}
          </button>
        </div>

        <div className="border border-muted-primary bg-background/40 px-2 py-1 text-xs text-muted-foreground">
          {t('activeCategoryCount', {
            category: t(`categories.${activeCategory}`),
            count: filteredItems.length,
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border border-muted-primary bg-background/35 p-2">
          {error ? (
            <p className="text-sm text-error">{error}</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
          ) : (
            <div className="space-y-1.5">
              {filteredItems.map((item) => {
                const checked = Boolean(progress[item.id])
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="flex w-full items-center gap-2 border border-muted-primary/70 bg-background/50 px-2 py-1.5 text-left transition hover:bg-muted-primary/10"
                    aria-pressed={checked}
                  >
                    <span
                      className={[
                        'inline-flex h-4 w-4 shrink-0 items-center justify-center border text-[11px] leading-none',
                        checked
                          ? 'border-success-border bg-success-bg text-success'
                          : 'border-muted-primary text-muted-foreground',
                      ].join(' ')}
                    >
                      {checked ? 'X' : ''}
                    </span>
                    {item.iconUrl ? (
                      <Image
                        src={item.iconUrl}
                        alt={item.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 border border-muted-primary/60 bg-background/70 object-contain p-0.5"
                        loading="lazy"
                        unoptimized
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          'block text-sm leading-tight',
                          checked
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground',
                        ].join(' ')}
                      >
                        {item.name}
                      </span>
                      {typeof item.masteryReq === 'number' ? (
                        <span className="text-xs text-muted-foreground">
                          {t('masteryRequirement', { mr: item.masteryReq })}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
