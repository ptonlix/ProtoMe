'use client'

import type { AdminPost, AdminPostsListResponse, PublishState } from './types'

const adminApiBaseUrl =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4100'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT'
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

export async function fetchPosts(
  adminKey: string,
  query?: {
    category?: string
    keyword?: string
    status?: 'draft' | 'published'
    page?: number
    pageSize?: number
  }
) {
  const params = new URLSearchParams()
  if (query?.category) {
    params.set('category', query.category)
  }
  if (query?.keyword) {
    params.set('keyword', query.keyword)
  }
  if (query?.status) {
    params.set('status', query.status)
  }
  if (query?.page) {
    params.set('page', String(query.page))
  }
  if (query?.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }
  const pathname = params.size > 0 ? `/api/admin/posts?${params.toString()}` : '/api/admin/posts'
  return request<AdminPostsListResponse>(pathname, { adminKey })
}

export async function fetchCategories(adminKey: string) {
  return request<{ categories: string[] }>('/api/admin/categories', { adminKey })
}

export async function fetchPost(adminKey: string, adminPath: string) {
  const query = new URLSearchParams({ path: adminPath })
  return request<{ post: AdminPost }>(`/api/admin/post?${query.toString()}`, { adminKey })
}

export async function createPost(adminKey: string, body: unknown) {
  return request<{ post: AdminPost }>('/api/admin/posts', {
    method: 'POST',
    body,
    adminKey,
  })
}

export async function updatePost(adminKey: string, adminPath: string, body: unknown) {
  const query = new URLSearchParams({ path: adminPath })
  return request<{ post: AdminPost }>(`/api/admin/post?${query.toString()}`, {
    method: 'PUT',
    body,
    adminKey,
  })
}

export async function publishPost(adminKey: string, adminPath: string) {
  const query = new URLSearchParams({ path: adminPath })
  return request<{ publish: PublishState }>(`/api/admin/post/publish?${query.toString()}`, {
    method: 'POST',
    body: {},
    adminKey,
  })
}

export async function fetchPublishState(adminKey: string) {
  return request<{ publish: PublishState }>('/api/admin/publish-status', { adminKey })
}

export async function uploadAsset(adminKey: string, adminPath: string, file: File) {
  const formData = new FormData()
  formData.set('file', file)

  const query = new URLSearchParams({ path: adminPath })
  const response = await fetch(`${adminApiBaseUrl}/api/admin/post/assets?${query.toString()}`, {
    method: 'POST',
    headers: {
      'x-admin-key': adminKey,
    },
    body: formData,
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error || '图片上传失败')
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
