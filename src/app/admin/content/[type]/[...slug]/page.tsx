import { redirect } from 'next/navigation'
import ContentEditor from '@/components/admin/ContentEditor'
import { isSingletonType } from '@/components/admin/content-config'
import type { ContentTypeKey } from '@/components/admin/types'

export default async function AdminContentEditPage({
  params,
}: {
  params: Promise<{ type: ContentTypeKey; slug: string[] }>
}) {
  const resolvedParams = await params
  if (isSingletonType(resolvedParams.type)) {
    redirect(`/admin/content/${resolvedParams.type}`)
  }

  return <ContentEditor typeKey={resolvedParams.type} adminPath={resolvedParams.slug.join('/')} />
}
