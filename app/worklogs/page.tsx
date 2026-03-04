import { allWorklogs } from 'contentlayer/generated'
import { genPageMetadata } from 'app/seo'
import WorklogsTimeline, { type WorklogListItem } from './WorklogsTimeline'

export const metadata = genPageMetadata({ title: 'Worklogs' })

export default function WorklogsPage() {
  const worklogs: WorklogListItem[] = [...allWorklogs]
    .filter((item) => item.privacy === 'public')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      date: item.date,
      summary: item.summary,
      tags: item.tags ?? [],
    }))

  return <WorklogsTimeline worklogs={worklogs} />
}
