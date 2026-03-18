import PostEditor from '@/components/admin/PostEditor'

export default async function AdminPostEditPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const resolvedParams = await params
  return <PostEditor adminPath={resolvedParams.slug.join('/')} />
}
