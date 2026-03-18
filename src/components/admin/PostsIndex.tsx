'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
import { fetchPosts, fetchPublishState } from './api'
import type { AdminPost, PublishState } from './types'

function StatusPill({ draft }: { draft: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        draft
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
      }`}
    >
      {draft ? '草稿' : '已发布'}
    </span>
  )
}

function PublishBanner({ state }: { state: PublishState | null }) {
  if (!state) return null
  return (
    <div className="ledger-panel border-ledger-border text-ledger-text-soft rounded-3xl border px-5 py-4 text-sm">
      当前发布状态：<span className="text-ledger-text font-semibold">{state.status}</span> ·{' '}
      {state.message}
    </div>
  )
}

export default function PostsIndex() {
  return <AdminAuthGate>{(adminKey) => <PostsIndexInner adminKey={adminKey} />}</AdminAuthGate>
}

function PostsIndexInner({ adminKey }: { adminKey: string }) {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [publishState, setPublishState] = useState<PublishState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([fetchPosts(adminKey), fetchPublishState(adminKey)])
      .then(([postsResponse, publishResponse]) => {
        if (!active) return
        setPosts(postsResponse.posts)
        setPublishState(publishResponse.publish)
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError instanceof Error ? requestError.message : '加载失败')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [adminKey])

  return (
    <AdminShell
      title="文章管理"
      description="管理 Blog 文章、草稿与发布任务。所有改动都会落盘为 MDX 文件。"
    >
      <PublishBanner state={publishState} />
      <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border">
        <div className="border-ledger-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-ledger-text text-lg font-semibold">文章列表</h2>
          <Link
            href="/admin/posts/new"
            className="bg-ledger-accent rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            新建文章
          </Link>
        </div>
        {error ? <p className="text-ledger-danger px-6 py-4 text-sm">{error}</p> : null}
        {loading ? (
          <p className="text-ledger-text-soft px-6 py-4 text-sm">正在加载文章...</p>
        ) : null}
        {!loading ? (
          <div className="divide-ledger-border divide-y">
            {posts.map((post) => (
              <Link
                href={`/admin/posts/${post.adminPath}`}
                key={post.adminPath}
                className="hover:bg-ledger-accent-soft/40 block px-6 py-5 transition"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-ledger-text text-lg font-semibold">{post.title}</h3>
                      <StatusPill draft={post.draft} />
                    </div>
                    <p className="text-ledger-text-soft mt-2 line-clamp-2 text-sm leading-7">
                      {post.summary}
                    </p>
                    <p className="text-ledger-text-soft mt-2 text-xs">
                      路径：{post.adminPath} · 日期：{new Date(post.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="ledger-chip rounded-full px-3 py-1 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </AdminShell>
  )
}
