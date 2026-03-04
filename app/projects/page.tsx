import Card from '@/components/Card'
import { allProjects } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  const projects = [...allProjects]
    .filter((item) => item.privacy === 'public')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            Projects
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            按更新时间展示公开项目，支持从结构化数据持续沉淀个人项目资产。
          </p>
        </div>
        <div className="container py-12">
          <div className="-m-4 flex flex-wrap">
            {projects.map((d) => (
              <Card
                key={d.id}
                title={d.title}
                description={d.summary ?? '暂无项目摘要。'}
                href={d.demo || d.repo}
                status={d.status}
                role={d.role}
                updatedAt={d.updatedAt}
                stack={d.stack}
                repo={d.repo}
                demo={d.demo}
              />
            ))}
          </div>
          {projects.length === 0 && (
            <p className="px-4 text-gray-500 dark:text-gray-400">
              暂无公开项目，请在 `data/projects/**/*.mdx` 中新增或将 `privacy` 设置为 `public`。
            </p>
          )}
        </div>
      </div>
    </>
  )
}
