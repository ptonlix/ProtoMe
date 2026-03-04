'use client'

import { useMemo, useState } from 'react'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'

export interface WorklogListItem {
  slug: string
  title: string
  date: string
  summary: string
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
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-4 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Worklogs
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          每日工作纪要与阶段性复盘（仅展示公开条目）。
        </p>
        <div className="relative max-w-lg">
          <label htmlFor="worklog-search-input" className="sr-only">
            搜索 Worklogs
          </label>
          <input
            id="worklog-search-input"
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="搜索标题、摘要或标签..."
            className="focus:border-primary-500 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:ring-0 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTagSlug(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              selectedTagSlug === null
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
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
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
                aria-label={`按标签 ${tag} 过滤`}
              >
                {`${tag} (${tagCounts[tag]})`}
              </button>
            )
          })}
        </div>
      </div>
      <div className="relative py-10">
        <div className="absolute top-0 bottom-0 left-3 hidden w-px bg-gray-200 sm:block dark:bg-gray-700" />
        {groupedWorklogs.length === 0 && (
          <p className="py-12 text-gray-500 dark:text-gray-400">未找到匹配内容，请调整筛选条件。</p>
        )}

        {groupedWorklogs.map((group) => (
          <section key={group.monthKey} className="relative mb-10">
            <div className="mb-6 pl-10 sm:pl-12">
              <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                {group.monthLabel}
              </h2>
            </div>

            <ul className="space-y-6">
              {group.items.map((worklog) => (
                <li key={worklog.slug} className="relative pl-10 sm:pl-12">
                  <span className="bg-primary-500 absolute top-7 left-[9px] hidden h-3 w-3 rounded-full border-2 border-white shadow sm:block dark:border-gray-950" />
                  <article className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900/60">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <time
                        dateTime={worklog.date}
                        className="text-sm leading-6 font-medium text-gray-500 dark:text-gray-400"
                      >
                        {formatDate(worklog.date, siteMetadata.locale)} ·{' '}
                        {getWeekdayLabel(worklog.date)}
                      </time>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {getRelativeTimeLabel(worklog.date)}
                      </span>
                    </div>
                    <h3 className="text-xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      {worklog.title}
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{worklog.summary}</p>
                    {worklog.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
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
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                                isActive
                                  ? 'bg-primary-500 text-white'
                                  : 'text-primary-500 border-primary-500/40 hover:bg-primary-500/10 dark:border-primary-400/40 border'
                              }`}
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
      </div>
    </div>
  )
}
