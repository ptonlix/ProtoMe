import Card from '@/components/Card'
import { allProjects } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  const projects = [...allProjects]
    .filter((item) => item.privacy === 'public')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const activeCount = projects.filter((item) => item.status === 'active').length
  const archivedCount = projects.filter((item) => item.status === 'archived').length

  return (
    <div className="space-y-6">
      <header className="ledger-surface p-5 md:p-6">
        <p className="ledger-kicker">Project Repository</p>
        <h1 className="ledger-heading mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">
          Projects
        </h1>
        <p className="text-ledger-text-soft mt-3 max-w-3xl text-sm leading-7">
          统一展示公开项目状态、更新时间与技术栈，便于快速扫描与长期维护。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="ledger-chip" data-active="true">
            总计 {projects.length}
          </span>
          <span className="ledger-chip">进行中 {activeCount}</span>
          <span className="ledger-chip">归档 {archivedCount}</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card
            key={project.id}
            title={project.title}
            description={project.summary ?? '暂无项目摘要。'}
            href={project.demo || project.repo}
            status={project.status}
            role={project.role}
            updatedAt={project.updatedAt}
            stack={project.stack}
            repo={project.repo}
            demo={project.demo}
          />
        ))}
      </section>

      {projects.length === 0 && (
        <div className="ledger-surface text-ledger-muted p-4 text-sm">
          暂无公开项目，请在 data/projects/**/*.mdx 中新增或将 privacy 设置为 public。
        </div>
      )}
    </div>
  )
}
