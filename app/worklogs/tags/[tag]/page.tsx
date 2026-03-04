import { allWorklogs } from 'contentlayer/generated'
import WorklogListLayoutWithTags from '@/layouts/WorklogListLayoutWithTags'
import { genPageMetadata } from 'app/seo'
import { slug } from 'github-slugger'
import worklogTagData from 'app/worklog-tag-data.json'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  return genPageMetadata({
    title: 'Worklogs',
    description: `Worklogs tagged with ${tag}`,
  })
}

export const generateStaticParams = async () => {
  const tagCounts = worklogTagData as Record<string, number>
  return Object.keys(tagCounts).map((tag) => ({
    tag: encodeURI(tag),
  }))
}

export default async function WorklogTagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const tagCounts = worklogTagData as Record<string, number>

  if (!(tag in tagCounts)) {
    return notFound()
  }

  const filteredWorklogs = [...allWorklogs]
    .filter(
      (worklog) =>
        worklog.privacy === 'public' &&
        worklog.tags &&
        worklog.tags.map((item) => slug(item)).includes(tag)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      date: item.date,
      summary: item.summary,
      tags: item.tags ?? [],
    }))

  if (filteredWorklogs.length === 0) {
    return notFound()
  }

  return (
    <WorklogListLayoutWithTags
      worklogs={filteredWorklogs}
      tagCounts={tagCounts}
      selectedTag={tag}
    />
  )
}
