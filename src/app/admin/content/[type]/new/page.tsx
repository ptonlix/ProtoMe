import { redirect } from 'next/navigation'
import ContentEditor from '@/components/admin/ContentEditor'
import { isSingletonType } from '@/components/admin/content-config'
import type { ContentTypeKey } from '@/components/admin/types'

export default async function AdminNewContentPage({
  params,
}: {
  params: Promise<{ type: ContentTypeKey }>
}) {
  const resolvedParams = await params
  if (isSingletonType(resolvedParams.type)) {
    redirect(`/admin/content/${resolvedParams.type}`)
  }

  return <ContentEditor typeKey={resolvedParams.type} />
}
