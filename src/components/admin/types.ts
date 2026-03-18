export type AdminPost = {
  adminPath: string
  filePath: string
  title: string
  date: string
  summary: string
  tags: string[]
  authors: string[]
  images: string[]
  draft: boolean
  layout: string
  bibliography?: string
  canonicalUrl?: string
  body: string
  lastmod?: string
}

export type PublishState = {
  status: 'idle' | 'running' | 'success' | 'failed'
  message: string
  currentPath: string | null
  startedAt: string | null
  finishedAt: string | null
}
