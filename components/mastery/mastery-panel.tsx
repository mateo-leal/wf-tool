'use client'

import Image from 'next/image'
import { MASTERY_CHECKLIST_STORAGE_KEY } from '@/lib/constants'
import {
  buildMasteryData,
  CATEGORY_ORDER,
  type MasteryCategory,
  type MasteryData,
} from '@/lib/mastery'
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ListIcon, CaretDownIcon } from '@phosphor-icons/react'
import { isDevelopment } from '@/lib/utils'
import { getDictionary } from '@/lib/language'
import {
  fetchPublicExportIntrinsics,
  fetchPublicExportSentinels,
  fetchPublicExportWarframes,
  fetchPublicExportWeapons,
} from '@/lib/public-export/fetch-public-export'

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

export function MasteryPanel() {
  const locale = useLocale()
  const t = useTranslations('masteryChecklist')

  const [masteryData, setMasteryData] = useState<MasteryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [activeCategory, setActiveCategory] =
    useState<MasteryCategory>('itemCompletion')
  const [activeSubcategory, setActiveSubcategory] = useState<string>('warframe')
  const [expandedCategories, setExpandedCategories] = useState<
    Set<MasteryCategory>
  >(new Set(['itemCompletion']))
  const [query, setQuery] = useState('')

  const [progress, setProgress] = useState<MasteryProgress>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadMasteryData() {
      setIsLoading(true)

      try {
        const [dict, weaponsMap, warframesMap, sentinelsMap, intrinsicsMap] =
          await Promise.all([
            getDictionary(locale),
            fetchPublicExportWeapons(),
            fetchPublicExportWarframes(),
            fetchPublicExportSentinels(),
            fetchPublicExportIntrinsics(),
          ])

        if (!isCancelled) {
          setMasteryData(
            buildMasteryData(
              dict,
              weaponsMap,
              warframesMap,
              sentinelsMap,
              intrinsicsMap
            )
          )
          setError(null)
          setIsLoading(false)
        }
      } catch {
        if (!isCancelled) {
          setMasteryData(null)
          setError(t('loadFailed'))
          setIsLoading(false)
        }
      }
    }

    void loadMasteryData()

    return () => {
      isCancelled = true
    }
  }, [locale, t])

  useEffect(() => {
    const savedProgress = loadProgress()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(savedProgress)
  }, [])

  const resolveSubcategoryLabel = (
    category: MasteryCategory,
    subcategory: string
  ) => {
    const serverLabel =
      masteryData?.subcategoryLabels?.[category]?.[subcategory]
    if (serverLabel) {
      return serverLabel
    }

    const key = `subcategories.${subcategory}`
    return t.has(key) ? t(key) : subcategory
  }

  const resolveItemLabel = (item: { name: string; rankNumber?: number }) => {
    if (typeof item.rankNumber === 'number') {
      return t('rankPrefix', { rank: item.rankNumber, item: item.name })
    }

    return item.name
  }

  const categorySubcategories = useMemo(() => {
    if (!masteryData) {
      return CATEGORY_ORDER.reduce(
        (accumulator, category) => {
          accumulator[category] = []
          return accumulator
        },
        {
          itemCompletion: [],
          railjackIntrinsic: [],
          drifterIntrinsic: [],
          starchartCompletion: [],
        } as Record<MasteryCategory, string[]>
      )
    }

    return CATEGORY_ORDER.reduce(
      (accumulator, category) => {
        accumulator[category] = Object.keys(masteryData[category] ?? {})
        return accumulator
      },
      {
        itemCompletion: [],
        railjackIntrinsic: [],
        drifterIntrinsic: [],
        starchartCompletion: [],
      } as Record<MasteryCategory, string[]>
    )
  }, [masteryData])

  const resolvedActiveSubcategory = useMemo(() => {
    const subcategories = categorySubcategories[activeCategory] ?? []
    if (subcategories.includes(activeSubcategory)) {
      return activeSubcategory
    }

    return subcategories[0] ?? null
  }, [activeCategory, activeSubcategory, categorySubcategories])

  const toggleCategoryExpanded = (category: MasteryCategory) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredItems = useMemo(() => {
    if (!resolvedActiveSubcategory) {
      return []
    }

    const categoryItems =
      masteryData?.[activeCategory]?.[resolvedActiveSubcategory] ?? []
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return categoryItems
    }

    return categoryItems.filter((item) =>
      item.name.toLowerCase().includes(normalizedQuery)
    )
  }, [activeCategory, masteryData, query, resolvedActiveSubcategory])

  type SubcategoryStats = {
    done: number
    total: number
    masteryPointsGained: number
    masteryPointsTotal: number
  }

  const categoryStats = useMemo(() => {
    if (!masteryData) {
      return {} as Record<string, SubcategoryStats>
    }

    return Object.fromEntries(
      CATEGORY_ORDER.flatMap((category) =>
        (categorySubcategories[category] ?? []).map((subcategory) => {
          const items = masteryData[category]?.[subcategory] ?? []
          const done = items.reduce(
            (count, item) => count + (progress[item.id] ? 1 : 0),
            0
          )
          const masteryPointsGained = items.reduce(
            (sum, item) =>
              sum + (progress[item.id] ? (item.masteryPoints ?? 0) : 0),
            0
          )
          const masteryPointsTotal = items.reduce(
            (sum, item) => sum + (item.masteryPoints ?? 0),
            0
          )

          return [
            `${category}:${subcategory}`,
            {
              done,
              total: items.length,
              masteryPointsGained,
              masteryPointsTotal,
            },
          ]
        })
      )
    ) as Record<string, SubcategoryStats>
  }, [categorySubcategories, masteryData, progress])

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
    if (!masteryData || !resolvedActiveSubcategory) {
      return
    }

    const ids = (
      masteryData[activeCategory]?.[resolvedActiveSubcategory] ?? []
    ).map((item) => item.id)

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
        <div className="flex flex-col divide-y divide-muted-primary/40">
          {CATEGORY_ORDER.map((category) => {
            const isExpanded = expandedCategories.has(category)

            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCategoryExpanded(category)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-2 text-left transition hover:bg-muted-primary/15"
                >
                  <p className="text-sm leading-tight font-semibold">
                    {t(`categories.${category}`)}
                  </p>
                  <CaretDownIcon
                    size={16}
                    weight="bold"
                    className={[
                      'shrink-0 transition-transform',
                      isExpanded ? 'rotate-0' : '-rotate-90',
                    ].join(' ')}
                  />
                </button>

                {isExpanded && (
                  <div className="flex flex-col divide-y divide-muted-primary/20">
                    {(categorySubcategories[category] ?? []).map(
                      (subcategory) => {
                        const statKey = `${category}:${subcategory}`
                        const stats = (
                          categoryStats as Record<string, SubcategoryStats>
                        )[statKey] ?? {
                          done: 0,
                          total: 0,
                          masteryPointsGained: 0,
                          masteryPointsTotal: 0,
                        }
                        const isActive =
                          activeCategory === category &&
                          activeSubcategory === subcategory

                        return (
                          <button
                            key={subcategory}
                            type="button"
                            onClick={() => {
                              setActiveCategory(category)
                              setActiveSubcategory(subcategory)
                              setSidebarOpen(false)
                            }}
                            className={[
                              'w-full px-4 py-2 text-left transition',
                              isActive
                                ? 'bg-success-bg text-success'
                                : 'text-foreground hover:bg-muted-primary/10',
                            ].join(' ')}
                          >
                            <p className="text-sm leading-tight">
                              {resolveSubcategoryLabel(category, subcategory)}
                            </p>
                            <p className="text-xs opacity-60">
                              {t('doneCount', {
                                count: stats.done,
                                total: stats.total,
                              })}
                            </p>
                            {stats.masteryPointsTotal > 0 && (
                              <p className="text-xs opacity-60">
                                {t('masteryPointsProgress', {
                                  gained: stats.masteryPointsGained,
                                  total: stats.masteryPointsTotal,
                                })}
                              </p>
                            )}
                          </button>
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
          {isDevelopment() && (
            <button
              type="button"
              onClick={clearCategory}
              className="shrink-0 border border-muted-primary bg-background px-2 py-1 text-sm text-foreground transition hover:bg-muted-primary/15"
            >
              {t('clearCategory')}
            </button>
          )}
        </div>

        <div className="border border-muted-primary bg-background/40 px-2 py-1 text-xs text-muted-foreground">
          {t('activeCategoryCount', {
            category: resolvedActiveSubcategory
              ? resolveSubcategoryLabel(
                  activeCategory,
                  resolvedActiveSubcategory
                )
              : '-',
            count: filteredItems.length,
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border border-muted-primary bg-background/35 p-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : error ? (
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
                        'inline-flex size-4 shrink-0 items-center justify-center border text-[11px] leading-none',
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
                        className="size-9 shrink-0 border border-muted-primary/60 bg-background/70 object-contain p-0.5"
                        loading="lazy"
                        unoptimized
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          'flex leading-tight gap-1',
                          checked
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground',
                        ].join(' ')}
                      >
                        {resolveItemLabel(item)}
                        {typeof item.masteryReq === 'number' &&
                          item.masteryReq > 0 && (
                            <span className="flex text-sm text-muted-foreground">
                              <Image
                                src="https://browse.wf/Lotus/Interface/Icons/MasteryRankIconSmall.png"
                                height={20}
                                width={20}
                                alt={t('masteryRequirement')}
                                title={t('masteryRequirement')}
                              />
                              {item.masteryReq}
                            </span>
                          )}
                      </span>
                    </span>
                    {typeof item.masteryPoints === 'number' && (
                      <span
                        className={[
                          'shrink-0 text-xs font-medium tabular-nums',
                          checked ? 'text-success' : 'text-muted-foreground',
                        ].join(' ')}
                      >
                        {t('masteryPoints', { points: item.masteryPoints })}
                      </span>
                    )}
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
