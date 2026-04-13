'use client'

import { useMemo, useState } from 'react'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import Image from '@/components/Image'
import siteMetadata from '@/data/siteMetadata'

export interface WorklogListItem {
  slug: string
  title: string
  date: string
  summary: string
  coverImage?: string
  tags: string[]
}

interface WorklogsTimelineProps {
  worklogs: WorklogListItem[]
}

function getRelativeTimeLabel(date: string) {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const dayMs = 1000 * 60 * 60 * 24
  const diffDays = Math.floor(diffMs / dayMs)

  if (diffDays < 0) return '未来'
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`
  return `${Math.floor(diffDays / 365)} 年前`
}

function getMonthKey(date: string) {
  const monthFormatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
  })
  return monthFormatter.format(new Date(date))
}

function getMonthLabel(date: string) {
  const monthFormatter = new Intl.DateTimeFormat(siteMetadata.locale, {
    year: 'numeric',
    month: 'long',
  })
  return monthFormatter.format(new Date(date))
}

function getWeekdayLabel(date: string) {
  const weekdayFormatter = new Intl.DateTimeFormat(siteMetadata.locale, {
    weekday: 'short',
  })
  return weekdayFormatter.format(new Date(date))
}

export default function WorklogsTimeline({ worklogs }: WorklogsTimelineProps) {
  const [selectedTagSlug, setSelectedTagSlug] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const normalizedSearch = searchValue.trim().toLowerCase()

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    worklogs.forEach((worklog) => {
      worklog.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return counts
  }, [worklogs])

  const sortedTags = useMemo(
    () =>
      Object.keys(tagCounts).sort((a, b) => {
        const countDiff = tagCounts[b] - tagCounts[a]
        return countDiff !== 0 ? countDiff : a.localeCompare(b)
      }),
    [tagCounts]
  )

  const filteredWorklogs = useMemo(
    () =>
      worklogs.filter((worklog) => {
        const tagMatched =
          selectedTagSlug === null || worklog.tags.some((tag) => slug(tag) === selectedTagSlug)

        if (!tagMatched) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const haystack = [worklog.title, worklog.summary, ...worklog.tags].join(' ').toLowerCase()
        return haystack.includes(normalizedSearch)
      }),
    [worklogs, selectedTagSlug, normalizedSearch]
  )

  const groupedWorklogs = useMemo(
    () =>
      filteredWorklogs.reduce<
        Array<{
          monthKey: string
          monthLabel: string
          items: WorklogListItem[]
        }>
      >((groups, worklog) => {
        const monthKey = getMonthKey(worklog.date)
        const existingGroup = groups.find((group) => group.monthKey === monthKey)

        if (existingGroup) {
          existingGroup.items.push(worklog)
          return groups
        }

        groups.push({
          monthKey,
          monthLabel: getMonthLabel(worklog.date),
          items: [worklog],
        })

        return groups
      }, []),
    [filteredWorklogs]
  )

  return (
    <div className="space-y-6">
      <header className="ledger-surface p-5 md:p-6">
        <p className="ledger-kicker">Execution Timeline</p>
        <h1 className="ledger-heading mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">
          Worklogs
        </h1>
        <p className="text-ledger-text-soft mt-3 max-w-3xl text-sm leading-7">
          以时间线索引沉淀执行记录，优先展示日期、主题与状态标签。
        </p>

        <div className="mt-4 space-y-3">
          <label htmlFor="worklog-search-input" className="sr-only">
            搜索 Worklogs
          </label>
          <input
            id="worklog-search-input"
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="搜索标题、摘要或标签"
            className="border-ledger-border bg-ledger-panel-muted text-ledger-text placeholder:text-ledger-muted w-full rounded-lg border px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTagSlug(null)}
              data-active={selectedTagSlug === null ? 'true' : 'false'}
              className="ledger-chip"
            >
              All ({worklogs.length})
            </button>
            {sortedTags.map((tag) => {
              const tagSlug = slug(tag)
              const isActive = selectedTagSlug === tagSlug
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setSelectedTagSlug((current) => (current === tagSlug ? null : tagSlug))
                  }
                  data-active={isActive ? 'true' : 'false'}
                  className="ledger-chip"
                  aria-label={`按标签 ${tag} 过滤`}
                >
                  {tag} ({tagCounts[tag]})
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <section className="ledger-surface p-5 md:p-6">
        {groupedWorklogs.length === 0 && (
          <p className="text-ledger-muted text-sm">未找到匹配内容，请调整筛选条件。</p>
        )}

        {groupedWorklogs.map((group) => (
          <section key={group.monthKey} className="relative pb-8 last:pb-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="ledger-kicker">{group.monthLabel}</span>
              <span className="bg-ledger-border h-px flex-1" />
            </div>

            <ul className="relative space-y-4 pl-0 md:pl-6">
              <div className="bg-ledger-border absolute top-0 bottom-0 left-2 hidden w-px md:block" />
              {group.items.map((worklog) => (
                <li key={worklog.slug} className="relative">
                  <span className="border-ledger-border-strong bg-ledger-accent absolute top-8 left-[5px] hidden h-3 w-3 rounded-full border md:block" />
                  <article className="ledger-surface-muted p-4 md:ml-4">
                    {worklog.coverImage ? (
                      <div className="mb-4 overflow-hidden rounded-xl">
                        <Image
                          src={worklog.coverImage}
                          alt={worklog.title}
                          width={960}
                          height={540}
                          className="h-44 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="text-ledger-muted mb-2 flex flex-wrap items-center gap-2 text-xs">
                      <time dateTime={worklog.date}>
                        {formatDate(worklog.date, siteMetadata.locale)} ·{' '}
                        {getWeekdayLabel(worklog.date)}
                      </time>
                      <span className="ledger-chip text-[0.64rem]">
                        {getRelativeTimeLabel(worklog.date)}
                      </span>
                    </div>
                    <h3 className="ledger-panel-title">{worklog.title}</h3>
                    <p className="text-ledger-text-soft mt-2 text-sm leading-7">
                      {worklog.summary}
                    </p>

                    {worklog.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {worklog.tags.map((tag) => {
                          const tagSlug = slug(tag)
                          const isActive = selectedTagSlug === tagSlug

                          return (
                            <button
                              key={`${worklog.slug}-${tag}`}
                              type="button"
                              onClick={() =>
                                setSelectedTagSlug((current) =>
                                  current === tagSlug ? null : tagSlug
                                )
                              }
                              data-active={isActive ? 'true' : 'false'}
                              className="ledger-chip"
                              aria-label={`按标签 ${tag} 过滤`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    </div>
  )
}
