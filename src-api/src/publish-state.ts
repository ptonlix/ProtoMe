export type PublishStatus = 'idle' | 'running' | 'success' | 'failed'

export type PublishState = {
  status: PublishStatus
  message: string
  currentPath: string | null
  startedAt: string | null
  finishedAt: string | null
}

export const publishState: PublishState = {
  status: 'idle',
  message: '尚未触发发布',
  currentPath: null,
  startedAt: null,
  finishedAt: null,
}
