import Tag from '@/components/Tag'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import { allWorklogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import { formatDate } from 'pliny/utils/formatDate'

export const metadata = genPageMetadata({ title: 'Worklogs' })

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

export default function WorklogsPage() {
  const worklogs = [...allWorklogs]
    .filter((item) => item.privacy === 'public')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const groupedWorklogs = worklogs.reduce<
    Array<{
      monthKey: string
      monthLabel: string
      items: typeof worklogs
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
  }, [])

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Worklogs
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
          每日工作纪要与阶段性复盘（仅展示公开条目）。
        </p>
        <p className="text-sm leading-6">
          <Link
            href="/worklogs/tags"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
          >
            查看 Worklogs 标签导航 &rarr;
          </Link>
        </p>
      </div>
      <div className="relative py-10">
        <div className="absolute top-0 bottom-0 left-3 hidden w-px bg-gray-200 sm:block dark:bg-gray-700" />
        {worklogs.length === 0 && (
          <p className="py-12 text-gray-500 dark:text-gray-400">
            暂无公开工作纪要，请将对应条目的 `privacy` 设置为 `public`。
          </p>
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
                      <div className="mt-4 flex flex-wrap">
                        {worklog.tags.map((tag) => (
                          <Tag
                            key={`${worklog.slug}-${tag}`}
                            text={tag}
                            basePath="/worklogs/tags"
                          />
                        ))}
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
