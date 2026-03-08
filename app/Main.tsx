import Link from '@/components/Link'
import Image from '@/components/Image'
import SocialIcon from '@/components/social-icons'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'

const MAX_BLOG_DISPLAY = 3
const MAX_PROJECT_DISPLAY = 4
const MAX_WORKLOG_DISPLAY = 4

const projectStatusMap = {
  active: { label: '进行中', className: 'ledger-status ledger-status-active' },
  idea: { label: '构思中', className: 'ledger-status ledger-status-idea' },
  paused: { label: '已暂停', className: 'ledger-status ledger-status-paused' },
  completed: { label: '已完成', className: 'ledger-status ledger-status-completed' },
  archived: { label: '已归档', className: 'ledger-status ledger-status-archived' },
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
  const profileSkills = (profile?.skills ?? []) as string[]
  const projectStacks = [
    ...new Set<string>(projects.flatMap((project) => (project.stack ?? []) as string[])),
  ]
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
  const mailHref = normalizeMailHref(heroEmail)

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="ledger-surface p-5 md:p-7">
        <div className="ledger-grid-columns">
          <div className="space-y-5 md:col-span-8">
            <p className="ledger-kicker">Console Identity</p>
            <div className="flex items-center gap-4">
              <div className="border-ledger-border bg-ledger-panel-muted relative h-20 w-20 overflow-hidden rounded-2xl border">
                <Image
                  src="/static/images/avatar.png"
                  alt={`${heroName} avatar`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div>
                <h1 className="ledger-heading text-3xl font-extrabold md:text-4xl">{heroName}</h1>
                <p className="text-ledger-muted mt-1 font-mono text-xs tracking-[0.1em] uppercase">
                  TECH LEDGER / PERSONAL INDEX
                </p>
              </div>
            </div>

            <p className="text-ledger-text-soft max-w-3xl text-base leading-7 md:text-lg">
              {heroHeadline}
            </p>

            <div className="text-ledger-muted flex flex-wrap items-center gap-2 text-sm">
              {heroLocation && <span>{heroLocation}</span>}
              {heroLocation && heroEmail && <span>·</span>}
              {heroEmail && <span>{heroEmail}</span>}
              {(heroLocation || heroEmail) && heroWebsite && <span>·</span>}
              {heroWebsite && (
                <Link href={heroWebsite} className="font-mono text-xs tracking-wide uppercase">
                  {heroWebsite.replace(/^https?:\/\//, '')}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/projects" className="ledger-btn ledger-btn-primary">
                查看项目仓库
              </Link>
              <Link href="/profile" className="ledger-btn ledger-btn-secondary">
                打开个人档案
              </Link>
              <Link href="/worklogs" className="ledger-btn ledger-btn-ghost">
                浏览最新纪要
              </Link>
            </div>
          </div>

          <aside className="space-y-4 md:col-span-4">
            <div className="ledger-surface-muted p-4">
              <p className="ledger-kicker">System Status</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="ledger-metric-card">
                  <span className="ledger-metric-label">Active Projects</span>
                  <span className="ledger-metric-value">{activeProjectCount}</span>
                </div>
                <div className="ledger-metric-card">
                  <span className="ledger-metric-label">Latest Update</span>
                  <span className="text-ledger-text mt-2 block text-sm font-semibold">
                    {recentDate ? formatDate(recentDate, siteMetadata.locale) : '--'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ledger-surface-muted p-4">
              <p className="ledger-kicker">Current Focus</p>
              {latestWorklog ? (
                <div className="mt-3 space-y-2">
                  <p className="ledger-panel-title">{latestWorklog.title}</p>
                  <p className="text-ledger-text-soft line-clamp-3 text-sm">
                    {latestWorklog.summary}
                  </p>
                </div>
              ) : (
                <p className="text-ledger-muted mt-3 text-sm">暂无公开进展。</p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="ledger-metric-card transition hover:-translate-y-0.5"
          >
            <span className="ledger-metric-label">{item.label}</span>
            <span className="ledger-metric-value text-2xl">{item.value}</span>
          </Link>
        ))}
      </section>

      <section className="ledger-grid-columns gap-4">
        <article className="ledger-surface space-y-4 p-5 md:col-span-7">
          <h2 className="ledger-divider-title">关于我</h2>
          {heroHighlights.length > 0 ? (
            <ul className="text-ledger-text-soft space-y-2 text-sm leading-7">
              {heroHighlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="bg-ledger-accent mt-2 h-1.5 w-1.5 rounded-full" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ledger-muted text-sm">
              暂无简介，可在 data/profile/default.mdx 中补充 highlights。
            </p>
          )}

          <div className="pt-2">
            <p className="ledger-kicker">Contact Channel</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {mailHref && (
                <Link href={mailHref} className="ledger-btn ledger-btn-primary text-xs">
                  发送邮件
                </Link>
              )}
              <Link href="/about" className="ledger-btn ledger-btn-secondary text-xs">
                查看 About
              </Link>
              {contactLinks.map((item) => (
                <span key={item.kind} className="ledger-chip px-2 py-1">
                  <SocialIcon kind={item.kind} href={item.href} size={4} />
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="ledger-surface space-y-4 p-5 md:col-span-5">
          <h2 className="ledger-divider-title">运行看板</h2>
          {latestWorklog ? (
            <div className="space-y-4">
              {latestWorklog.focus?.length > 0 && (
                <div>
                  <p className="ledger-kicker">当前重点</p>
                  <ul className="text-ledger-text-soft mt-2 space-y-1 text-sm">
                    {latestWorklog.focus.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="bg-ledger-accent mt-2 h-1 w-1 rounded-full" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestWorklog.nextActions?.length > 0 && (
                <div>
                  <p className="ledger-kicker">下一步动作</p>
                  <ul className="text-ledger-text-soft mt-2 space-y-1 text-sm">
                    {latestWorklog.nextActions.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="bg-ledger-success mt-2 h-1 w-1 rounded-full" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-ledger-muted text-sm">暂无公开工作纪要。</p>
          )}
        </article>
      </section>

      <section className="ledger-surface p-5">
        <h2 className="ledger-divider-title">技能图谱</h2>
        {skillGroups.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {skillGroups.map((group) => (
              <article key={group.title} className="ledger-surface-muted p-4">
                <p className="ledger-kicker">{group.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <span key={`${group.title}-${skill}`} className="ledger-chip text-[0.65rem]">
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-ledger-muted mt-4 text-sm">
            暂未配置技能数据，可在 profile 的 skills 字段中维护。
          </p>
        )}
      </section>

      <section className="ledger-grid-columns gap-4">
        <article className="ledger-surface space-y-4 p-5 md:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="ledger-divider-title">最近动态</h2>
            <Link href="/worklogs" className="ledger-btn ledger-btn-ghost text-xs">
              全部纪要
            </Link>
          </div>

          <ul className="space-y-3">
            {!worklogs.length && <li className="text-ledger-muted text-sm">暂无公开工作纪要。</li>}
            {worklogs.slice(0, MAX_WORKLOG_DISPLAY).map((worklog) => (
              <li key={worklog.slug} className="ledger-surface-muted p-4">
                <time className="text-ledger-muted text-xs" dateTime={worklog.date}>
                  {formatDate(worklog.date, siteMetadata.locale)}
                </time>
                <h3 className="text-ledger-text mt-1 text-base font-semibold">{worklog.title}</h3>
                <p className="text-ledger-text-soft mt-2 line-clamp-2 text-sm">{worklog.summary}</p>
                {worklog.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {worklog.tags.slice(0, 4).map((tag) => (
                      <span key={`${worklog.slug}-${tag}`} className="ledger-chip text-[0.65rem]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </article>

        <article className="ledger-surface space-y-4 p-5 md:col-span-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="ledger-divider-title">最新 Blog</h2>
            <Link href="/blog" className="ledger-btn ledger-btn-ghost text-xs">
              全部文章
            </Link>
          </div>

          <ul className="space-y-3">
            {!posts.length && <li className="text-ledger-muted text-sm">暂无博客内容。</li>}
            {posts.slice(0, MAX_BLOG_DISPLAY).map((post) => (
              <li key={post.slug} className="ledger-surface-muted p-4">
                <time className="text-ledger-muted text-xs" dateTime={post.date}>
                  {formatDate(post.date, siteMetadata.locale)}
                </time>
                <h3 className="text-ledger-text mt-1 text-base font-semibold">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-ledger-text hover:text-ledger-accent"
                  >
                    {post.title}
                  </Link>
                </h3>
                {post.summary && (
                  <p className="text-ledger-text-soft mt-2 line-clamp-2 text-sm">{post.summary}</p>
                )}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="ledger-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="ledger-divider-title">项目管线</h2>
          <Link href="/projects" className="ledger-btn ledger-btn-ghost text-xs">
            查看全部
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {projects.slice(0, MAX_PROJECT_DISPLAY).map((project) => {
            const statusMeta = projectStatusMap[project.status] ?? {
              label: project.status,
              className: 'ledger-status ledger-status-archived',
            }
            const actionLink = project.demo || project.repo || '/projects'

            return (
              <article key={project.id} className="ledger-surface-muted p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className={statusMeta.className}>{statusMeta.label}</span>
                  <time className="text-ledger-muted text-xs" dateTime={project.updatedAt}>
                    {formatDate(project.updatedAt, siteMetadata.locale)}
                  </time>
                </div>
                <h3 className="ledger-panel-title">
                  <Link href={actionLink} className="text-ledger-text hover:text-ledger-accent">
                    {project.title}
                  </Link>
                </h3>
                <p className="text-ledger-text-soft mt-2 line-clamp-2 text-sm">
                  {project.summary ?? '暂无项目摘要。'}
                </p>
                {project.stack?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.stack.slice(0, 4).map((tech) => (
                      <span key={`${project.id}-${tech}`} className="ledger-chip text-[0.64rem]">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {projects.length === 0 && <p className="text-ledger-muted text-sm">暂无公开项目。</p>}
      </section>
    </div>
  )
}
