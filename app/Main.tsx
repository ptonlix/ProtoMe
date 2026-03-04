import Link from '@/components/Link'
import Image from '@/components/Image'
import SocialIcon from '@/components/social-icons'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'

const MAX_BLOG_DISPLAY = 3
const MAX_PROJECT_DISPLAY = 3
const MAX_WORKLOG_DISPLAY = 3

const projectStatusMap = {
  active: {
    label: '进行中',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  idea: {
    label: '构思中',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
  paused: {
    label: '已暂停',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  completed: {
    label: '已完成',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  archived: {
    label: '已归档',
    className: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
}

function normalizeMailHref(email: string | undefined) {
  if (!email) return undefined
  if (email.startsWith('mailto:')) return email
  return `mailto:${email}`
}

function buildSkillGroups(skills: string[], stacks: string[]) {
  const allSkills = [...new Set([...skills, ...stacks])]
  const groups = [
    {
      title: '产品与业务',
      matcher: (value: string) => /(产品|product|design|ux|strategy|growth|运营|业务)/i.test(value),
      items: [] as string[],
    },
    {
      title: '工程与架构',
      matcher: (value: string) =>
        /(react|next|typescript|node|tailwind|frontend|backend|devops|工程|前端|后端|架构)/i.test(
          value
        ),
      items: [] as string[],
    },
    {
      title: 'AI 与自动化',
      matcher: (value: string) =>
        /(ai|llm|agent|prompt|ml|模型|智能|机器学习|知识库|自动化)/i.test(value),
      items: [] as string[],
    },
  ]

  allSkills.forEach((skill) => {
    const targetGroup = groups.find((group) => group.matcher(skill))
    if (targetGroup) {
      targetGroup.items.push(skill)
      return
    }
    groups[1].items.push(skill)
  })

  return groups.filter((group) => group.items.length > 0)
}

export default function Home({ posts, profile, projects, worklogs }) {
  const heroName = profile?.name ?? siteMetadata.author
  const heroHeadline = profile?.headline ?? siteMetadata.description
  const heroEmail = profile?.email ?? siteMetadata.email
  const heroLocation = profile?.location
  const heroWebsite = profile?.website ?? siteMetadata.siteUrl
  const heroHighlights = profile?.highlights ?? []
  const profileSkills = profile?.skills ?? []
  const projectStacks = [...new Set(projects.flatMap((project) => project.stack ?? []))]
  const skillGroups = buildSkillGroups(profileSkills, projectStacks)
  const latestWorklog = worklogs[0]
  const latestPost = posts[0]
  const latestProject = projects[0]
  const activeProjectCount = projects.filter((project) => project.status === 'active').length
  const recentDate =
    latestWorklog?.date ??
    latestProject?.updatedAt ??
    latestPost?.date ??
    profile?.updatedAt ??
    null

  const summaryCards = [
    { label: '公开项目', value: `${projects.length}`, href: '/projects' },
    { label: '进行中项目', value: `${activeProjectCount}`, href: '/projects' },
    { label: '博客文章', value: `${posts.length}`, href: '/blog' },
    { label: '工作纪要', value: `${worklogs.length}`, href: '/worklogs' },
    {
      label: '技能关键词',
      value: `${profileSkills.length || projectStacks.length}`,
      href: '/profile',
    },
    {
      label: '最近更新',
      value: recentDate ? formatDate(recentDate, siteMetadata.locale) : '--',
      href: '/worklogs',
    },
  ]

  const contactLinks = [
    { kind: 'mail', href: normalizeMailHref(heroEmail) },
    { kind: 'github', href: siteMetadata.github },
    { kind: 'linkedin', href: siteMetadata.linkedin },
    { kind: 'x', href: siteMetadata.x },
  ] as const

  return (
    <div className="space-y-14 pt-6 pb-10 md:space-y-16">
      <section className="grid gap-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-white p-6 shadow-sm md:grid-cols-12 md:p-8 dark:border-gray-700 dark:from-gray-900/70 dark:via-gray-900 dark:to-gray-950">
        <div className="space-y-5 md:col-span-7">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <Image
                src="/static/images/avatar.png"
                alt={`${heroName} avatar`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Home 总览
              </p>
              <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-gray-900 md:text-4xl dark:text-gray-100">
                {heroName}
              </h1>
            </div>
          </div>

          <p className="text-lg leading-8 text-gray-600 dark:text-gray-300">{heroHeadline}</p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {heroLocation && <span>{heroLocation}</span>}
            {heroLocation && heroEmail && <span>·</span>}
            {heroEmail && <span>{heroEmail}</span>}
            {(heroLocation || heroEmail) && heroWebsite && <span>·</span>}
            {heroWebsite && (
              <Link href={heroWebsite} className="text-primary-500 hover:text-primary-600">
                {heroWebsite.replace(/^https?:\/\//, '')}
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="bg-primary-500 hover:bg-primary-600 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
            >
              查看作品
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500"
            >
              了解更多
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 p-5 md:col-span-5 dark:border-gray-700 dark:bg-gray-900/60">
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
            当前状态
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
              <p className="text-xs text-gray-500 dark:text-gray-400">进行中项目</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activeProjectCount}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
              <p className="text-xs text-gray-500 dark:text-gray-400">最近更新</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {recentDate ? formatDate(recentDate, siteMetadata.locale) : '--'}
              </p>
            </div>
          </div>

          {latestWorklog && (
            <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                最新进展
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {latestWorklog.title}
              </p>
              <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                {latestWorklog.summary}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900/60"
          >
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 md:col-span-8 dark:border-gray-700 dark:bg-gray-900/60">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            关于我
          </h2>
          {heroHighlights.length > 0 ? (
            <ul className="space-y-3">
              {heroHighlights.map((item) => (
                <li key={item} className="text-gray-600 dark:text-gray-300">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              暂无更多简介信息，可在 `data/profile/default.mdx` 的 `highlights` 中补充。
            </p>
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 md:col-span-4 dark:border-gray-700 dark:bg-gray-900/60">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            现在在做什么
          </h2>
          {latestWorklog ? (
            <>
              {latestWorklog.focus?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    当前重点
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {latestWorklog.focus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {latestWorklog.nextActions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    下一步
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {latestWorklog.nextActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">暂无公开工作纪要。</p>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            精选项目
          </h2>
          <Link
            href="/projects"
            className="text-primary-500 hover:text-primary-600 text-sm font-semibold"
          >
            查看全部项目 &rarr;
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, MAX_PROJECT_DISPLAY).map((project) => {
            const statusMeta = projectStatusMap[project.status] ?? {
              label: project.status,
              className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            }
            const actionLink = project.demo || project.repo || '/projects'

            return (
              <article
                key={project.id}
                className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                  <time
                    className="text-xs text-gray-500 dark:text-gray-400"
                    dateTime={project.updatedAt}
                  >
                    {formatDate(project.updatedAt, siteMetadata.locale)}
                  </time>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {project.title}
                </h3>
                <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                  {project.summary ?? '暂无项目摘要。'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.stack.slice(0, 4).map((tech) => (
                    <span
                      key={`${project.id}-${tech}`}
                      className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 text-sm font-semibold">
                  <Link href={actionLink} className="text-primary-500 hover:text-primary-600">
                    查看项目
                  </Link>
                  {project.repo && project.demo && (
                    <Link
                      href={project.repo}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300"
                    >
                      源码
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {projects.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            暂无公开项目，先去 `Projects` 页面补充内容。
          </p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 md:col-span-7 dark:border-gray-700 dark:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              最新 Blog
            </h2>
            <Link
              href="/blog"
              className="text-primary-500 hover:text-primary-600 text-sm font-semibold"
            >
              全部文章 &rarr;
            </Link>
          </div>

          <ul className="space-y-4">
            {!posts.length && (
              <li className="text-sm text-gray-500 dark:text-gray-400">暂无博客内容。</li>
            )}
            {posts.slice(0, MAX_BLOG_DISPLAY).map((post) => (
              <li
                key={post.slug}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={post.date}>
                  {formatDate(post.date, siteMetadata.locale)}
                </time>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary-500">
                    {post.title}
                  </Link>
                </h3>
                {post.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                    {post.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 md:col-span-5 dark:border-gray-700 dark:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              最新动态
            </h2>
            <Link
              href="/worklogs"
              className="text-primary-500 hover:text-primary-600 text-sm font-semibold"
            >
              全部纪要 &rarr;
            </Link>
          </div>

          <ul className="space-y-4">
            {!worklogs.length && (
              <li className="text-sm text-gray-500 dark:text-gray-400">暂无公开工作纪要。</li>
            )}
            {worklogs.slice(0, MAX_WORKLOG_DISPLAY).map((worklog) => (
              <li
                key={worklog.slug}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={worklog.date}>
                  {formatDate(worklog.date, siteMetadata.locale)}
                </time>
                <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                  {worklog.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {worklog.summary}
                </p>
                {worklog.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {worklog.tags.slice(0, 3).map((tag) => (
                      <span
                        key={`${worklog.slug}-${tag}`}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900/60">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          技能与工具
        </h2>
        {skillGroups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {skillGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <p className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-200">
                  {group.title}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <span
                      key={`${group.title}-${skill}`}
                      className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            暂未配置技能数据，可在 `data/profile/default.mdx` 的 `skills` 字段中维护。
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          联系我
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          如果你有项目合作、技术交流或产品讨论需求，欢迎通过以下方式联系。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {normalizeMailHref(heroEmail) && (
            <Link
              href={normalizeMailHref(heroEmail)}
              className="bg-primary-500 hover:bg-primary-600 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
            >
              发送邮件
            </Link>
          )}
          <Link
            href="/about"
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500"
          >
            查看 About
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {contactLinks.map((item) => (
            <SocialIcon key={item.kind} kind={item.kind} href={item.href} size={5} />
          ))}
        </div>
      </section>
    </div>
  )
}
