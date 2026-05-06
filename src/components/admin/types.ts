export type ContentTypeKey = 'blog' | 'profile' | 'project' | 'authors' | 'worklog' | 'about'

export type ContentMode = 'singleton' | 'collection'

export type StatusTone = 'neutral' | 'amber' | 'green' | 'blue'

export type AdminContentType = {
  key: ContentTypeKey
  label: string
  description: string
  mode: ContentMode
  supportsAssets: boolean
  statusFilterLabel?: string
  statusOptions: Array<{ value: string; label: string }>
  groupFilterLabel?: string
}

export type AdminContentItem = {
  type: ContentTypeKey
  adminPath: string
  filePath: string
  title: string
  summary: string
  body: string
  frontmatter: Record<string, unknown>
  lastmod?: string
  updatedAt?: string
  displayStatus: {
    value: string
    label: string
    tone: StatusTone
  }
  group?: {
    value: string
    label: string
  }
}

export type AdminContentListResponse = {
  items: AdminContentItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  availableGroups: string[]
}
