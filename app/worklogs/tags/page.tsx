import WorklogListLayoutWithTags from '@/layouts/WorklogListLayoutWithTags'
import { allWorklogs } from 'contentlayer/generated'
import worklogTagData from 'app/worklog-tag-data.json'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({
  title: 'Worklogs',
  description: 'Worklogs 标签导航与内容检索',
})

export default function WorklogTagsPage() {
  const worklogs = [...allWorklogs]
    .filter((item) => item.privacy === 'public')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      date: item.date,
      summary: item.summary,
      tags: item.tags ?? [],
    }))

  const tagCounts = worklogTagData as Record<string, number>

  return <WorklogListLayoutWithTags worklogs={worklogs} tagCounts={tagCounts} />
}
