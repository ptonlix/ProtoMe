import ContentEditor from './ContentEditor'

export default function PostEditor({ adminPath }: { adminPath?: string }) {
  return <ContentEditor typeKey="blog" adminPath={adminPath} />
}
