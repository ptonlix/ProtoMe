'use client'

import { useMemo, useState } from 'react'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'

interface WorklogItem {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
}

interface WorklogListLayoutWithTagsProps {
  worklogs: WorklogItem[]
  tagCounts: Record<string, number>
  selectedTag?: string
}

function formatTagLabel(tag: string) {
  return tag.replace(/-/g, ' ')
}

export default function WorklogListLayoutWithTags({
  worklogs,
  tagCounts,
  selectedTag,
}: WorklogListLayoutWithTagsProps) {
  const [searchValue, setSearchValue] = useState('')
  const normalizedSearch = searchValue.trim().toLowerCase()
  const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])

  const filteredWorklogs = useMemo(() => {
    if (!normalizedSearch) return worklogs

    return worklogs.filter((worklog) => {
      const haystack = [worklog.title, worklog.summary, ...worklog.tags].join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [worklogs, normalizedSearch])

  return (
    <div>
      <div className="pt-6 pb-6">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Worklogs
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {selectedTag ? `当前标签：${formatTagLabel(selectedTag)}` : '全部公开 Worklogs'}
        </p>
      </div>
      <div className="flex sm:space-x-24">
        <div className="hidden h-full max-h-screen max-w-[280px] min-w-[280px] flex-wrap overflow-auto rounded-sm bg-gray-50 pt-5 shadow-md sm:flex dark:bg-gray-900/70 dark:shadow-gray-800/40">
          <div className="px-6 py-4">
            <Link
              href="/worklogs/tags"
              className={`font-bold uppercase ${
                !selectedTag
                  ? 'text-primary-500'
                  : 'hover:text-primary-500 dark:hover:text-primary-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Worklogs
            </Link>
            <ul className="mt-3">
              {sortedTags.map((tag) => {
                const isActive = selectedTag === tag
                return (
                  <li key={tag} className="my-3">
                    {isActive ? (
                      <h3 className="text-primary-500 inline px-3 py-2 text-sm font-bold uppercase">
                        {`${formatTagLabel(tag)} (${tagCounts[tag]})`}
                      </h3>
                    ) : (
                      <Link
                        href={`/worklogs/tags/${slug(tag)}`}
                        className="hover:text-primary-500 dark:hover:text-primary-500 px-3 py-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-300"
                        aria-label={`View worklogs tagged ${tag}`}
                      >
                        {`${formatTagLabel(tag)} (${tagCounts[tag]})`}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="w-full">
          <div className="pb-6">
            <label htmlFor="worklog-search" className="sr-only">
              搜索 worklogs
            </label>
            <input
              id="worklog-search"
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={selectedTag ? '在当前标签下搜索...' : '搜索 worklogs...'}
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredWorklogs.length === 0 && (
              <li className="py-8 text-gray-500 dark:text-gray-400">
                未找到匹配内容，请调整标签或搜索关键词。
              </li>
            )}
            {filteredWorklogs.map((worklog) => (
              <li key={worklog.slug} className="py-8">
                <article className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      {worklog.title}
                    </h2>
                    <time
                      dateTime={worklog.date}
                      className="text-sm leading-6 font-medium text-gray-500 dark:text-gray-400"
                    >
                      {formatDate(worklog.date, siteMetadata.locale)}
                    </time>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{worklog.summary}</p>
                  {worklog.tags.length > 0 && (
                    <div className="flex flex-wrap">
                      {worklog.tags.map((item) => (
                        <Tag
                          key={`${worklog.slug}-${item}`}
                          text={item}
                          basePath="/worklogs/tags"
                        />
                      ))}
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
