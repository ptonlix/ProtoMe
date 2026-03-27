import ContentEditor from '@/components/admin/ContentEditor'
import ContentIndex from '@/components/admin/ContentIndex'
import { isSingletonType } from '@/components/admin/content-config'
import type { ContentTypeKey } from '@/components/admin/types'

export default async function AdminContentTypePage({
  params,
}: {
  params: Promise<{ type: ContentTypeKey }>
}) {
  const resolvedParams = await params
  return isSingletonType(resolvedParams.type) ? (
    <ContentEditor typeKey={resolvedParams.type} />
  ) : (
    <ContentIndex typeKey={resolvedParams.type} />
  )
}
