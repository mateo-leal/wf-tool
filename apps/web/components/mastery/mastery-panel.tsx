'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { ListIcon, CaretDownIcon } from '@phosphor-icons/react'

import type { MasteryCategory, MasteryData } from '@/lib/mastery/types'
import {
  loadProgress,
  MasteryProgress,
  saveProgress,
} from '@/lib/mastery/client'
import { isDevelopment } from '@/lib/utils'

const CATEGORY_ORDER: MasteryCategory[] = [
  'itemCompletion',
  'railjackIntrinsic',
  // 'drifterIntrinsic',
  // 'starchartCompletion',
]

export function MasteryPanel({ masteryData }: { masteryData: MasteryData }) {
  const t = useTranslations('masteryChecklist')

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(loadProgress())
  }, [])

  const resolveSubcategoryLabel = (cat: MasteryCategory, sub: string) => {
    const serverLabel = masteryData?.subcategoryLabels?.[cat]?.[sub]
    if (serverLabel) return serverLabel
    const key = `subcategories.${sub}`
    return t.has(key) ? t(key) : sub
  }

  const resolveItemLabel = (item: { name: string; rankNumber?: number }) => {
    return typeof item.rankNumber === 'number'
      ? t('rankPrefix', { rank: item.rankNumber, item: item.name })
      : item.name
  }

  const categorySubcategories = useMemo(() => {
    return CATEGORY_ORDER.reduce(
      (acc, cat) => {
        acc[cat] = Object.keys(masteryData[cat] ?? {})
        return acc
      },
      {} as Record<MasteryCategory, string[]>
    )
  }, [masteryData])

  const resolvedActiveSubcategory = useMemo(() => {
    const subcats = categorySubcategories[activeCategory] ?? []
    return subcats.includes(activeSubcategory)
      ? activeSubcategory
      : (subcats[0] ?? null)
  }, [activeCategory, activeSubcategory, categorySubcategories])

  const filteredItems = useMemo(() => {
    if (!resolvedActiveSubcategory) return []
    const items =
      masteryData?.[activeCategory]?.[resolvedActiveSubcategory] ?? []
    const q = query.trim().toLowerCase()
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items
  }, [activeCategory, masteryData, query, resolvedActiveSubcategory])

  const categoryStats = useMemo(() => {
    return Object.fromEntries(
      CATEGORY_ORDER.flatMap((cat) =>
        (categorySubcategories[cat] ?? []).map((sub) => {
          const items = masteryData[cat]?.[sub] ?? []
          return [
            `${cat}:${sub}`,
            items.reduce(
              (acc, item) => {
                const isDone = !!progress[item.id]
                acc.done += isDone ? 1 : 0
                acc.masteryPointsGained += isDone
                  ? (item.masteryPoints ?? 0)
                  : 0
                acc.masteryPointsTotal += item.masteryPoints ?? 0
                return acc
              },
              {
                done: 0,
                total: items.length,
                masteryPointsGained: 0,
                masteryPointsTotal: 0,
              }
            ),
          ]
        })
      )
    )
  }, [categorySubcategories, masteryData, progress])

  function toggleItem(itemId: string) {
    setProgress((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] }
      saveProgress(next)
      return next
    })
  }

  function clearCategory() {
    if (!resolvedActiveSubcategory) return
    const ids = (
      masteryData[activeCategory]?.[resolvedActiveSubcategory] ?? []
    ).map((i) => i.id)
    setProgress((prev) => {
      const next = { ...prev }
      ids.forEach((id) => delete next[id])
      saveProgress(next)
      return next
    })
  }

  function toggleGroup(isExpanded: boolean, category: MasteryCategory) {
    const next = new Set(expandedCategories)
    if (isExpanded) {
      next.delete(category)
    } else {
      next.add(category)
    }
    setExpandedCategories(next)
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
                  onClick={() => toggleGroup(isExpanded, category)}
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
                    {categorySubcategories[category]?.map((subcategory) => {
                      const statKey = `${category}:${subcategory}`
                      const stats = categoryStats[statKey] ?? {
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
                    })}
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
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
          ) : (
            <div className="space-y-1.5">
              {filteredItems.map((item, index) => {
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
                        loading={index < 12 ? 'eager' : 'lazy'}
                        preload={index < 12 && activeSubcategory === 'warframe'}
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
