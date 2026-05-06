'use client'

import type {
  AdminContentItem,
  AdminContentListResponse,
  AdminContentType,
  ContentTypeKey,
} from './types'

const adminApiBaseUrl =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4100'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  adminKey: string
}

async function request<T>(pathname: string, options: RequestOptions): Promise<T> {
  const response = await fetch(`${adminApiBaseUrl}${pathname}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': options.adminKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error || '请求失败')
  }

  return payload as T
}

export async function fetchContentTypes(adminKey: string) {
  return request<{ types: AdminContentType[] }>('/api/admin/content/types', { adminKey })
}

export async function fetchContents(
  adminKey: string,
  type: ContentTypeKey,
  query?: {
    keyword?: string
    status?: string
    group?: string
    page?: number
    pageSize?: number
  }
) {
  const params = new URLSearchParams({ type })
  if (query?.keyword) {
    params.set('keyword', query.keyword)
  }
  if (query?.status) {
    params.set('status', query.status)
  }
  if (query?.group) {
    params.set('group', query.group)
  }
  if (query?.page) {
    params.set('page', String(query.page))
  }
  if (query?.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }

  return request<AdminContentListResponse>(`/api/admin/content?${params.toString()}`, { adminKey })
}

export async function fetchContentItem(adminKey: string, type: ContentTypeKey, adminPath?: string) {
  const params = new URLSearchParams({ type })
  if (adminPath) {
    params.set('path', adminPath)
  }
  return request<{ item: AdminContentItem }>(`/api/admin/content/item?${params.toString()}`, {
    adminKey,
  })
}

export async function createContentItem(adminKey: string, type: ContentTypeKey, body: unknown) {
  const params = new URLSearchParams({ type })
  return request<{ item: AdminContentItem }>(`/api/admin/content?${params.toString()}`, {
    method: 'POST',
    body,
    adminKey,
  })
}

export async function updateContentItem(
  adminKey: string,
  type: ContentTypeKey,
  adminPath: string | undefined,
  body: unknown
) {
  const params = new URLSearchParams({ type })
  if (adminPath) {
    params.set('path', adminPath)
  }
  return request<{ item: AdminContentItem }>(`/api/admin/content/item?${params.toString()}`, {
    method: 'PUT',
    body,
    adminKey,
  })
}

export async function deleteContentItem(adminKey: string, type: ContentTypeKey, adminPath: string) {
  const params = new URLSearchParams({ type, path: adminPath })
  return request<{
    result: {
      type: ContentTypeKey
      adminPath: string
      filePath: string
      assetDir: string | null
      requiresPublish: boolean
    }
  }>(`/api/admin/content/item?${params.toString()}`, {
    method: 'DELETE',
    adminKey,
  })
}

export async function uploadContentAsset(
  adminKey: string,
  type: ContentTypeKey,
  adminPath: string | undefined,
  file: File
) {
  const formData = new FormData()
  formData.set('file', file)

  const params = new URLSearchParams({ type })
  if (adminPath) {
    params.set('path', adminPath)
  }

  const response = await fetch(
    `${adminApiBaseUrl}/api/admin/content/item/assets?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        'x-admin-key': adminKey,
      },
      body: formData,
    }
  )

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error || '资源上传失败')
  }

  return payload as {
    asset: {
      src: string
      alt: string
      markdown: string
      size: number
      mimeType: string
    }
  }
}
