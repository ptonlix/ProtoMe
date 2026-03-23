'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
import { fetchCategories, fetchPosts } from './api'
import type { AdminPost } from './types'

const pageSizeOptions = [10, 20, 50]
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '仅草稿' },
  { value: 'published', label: '仅已发布' },
] as const

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

export default function PostsIndex() {
  return (
    <AdminAuthGate>
      {(adminKey, handleLogout) => (
        <PostsIndexInner adminKey={adminKey} handleLogout={handleLogout} />
      )}
    </AdminAuthGate>
  )
}

function PostsIndexInner({
  adminKey,
  handleLogout,
}: {
  adminKey: string
  handleLogout: () => void
}) {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'' | 'draft' | 'published'>('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim())
      setPage(1)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [keywordInput])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      fetchPosts(adminKey, {
        category: selectedCategory || undefined,
        keyword: keyword || undefined,
        status: selectedStatus || undefined,
        page,
        pageSize,
      }),
      fetchCategories(adminKey),
    ])
      .then(([postsResponse, categoriesResponse]) => {
        if (!active) return
        setPosts(postsResponse.items)
        setCategories(categoriesResponse.categories)
        setTotal(postsResponse.total)
        setTotalPages(postsResponse.totalPages)
        setPage(postsResponse.page)
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
  }, [adminKey, page, pageSize, selectedCategory, selectedStatus, keyword])

  return (
    <AdminShell
      title="文章管理"
      description="管理 Blog 文章、草稿与发布任务"
      onLogout={handleLogout}
    >
      <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border">
        <div className="border-ledger-border border-b px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-ledger-text text-lg font-semibold">文章列表</h2>
                <span className="border-ledger-border text-ledger-text-soft rounded-full border bg-white/60 px-3 py-1 text-xs dark:bg-slate-950/40">
                  共 {total} 篇
                </span>
                {selectedCategory ? (
                  <span className="bg-ledger-accent-soft/60 text-ledger-text rounded-full px-3 py-1 text-xs font-medium">
                    分类：{selectedCategory}
                  </span>
                ) : null}
                {selectedStatus ? (
                  <span className="text-ledger-text rounded-full bg-white/70 px-3 py-1 text-xs font-medium dark:bg-slate-950/40">
                    状态：{selectedStatus === 'draft' ? '草稿' : '已发布'}
                  </span>
                ) : null}
                {keyword ? (
                  <span className="text-ledger-text rounded-full bg-white/70 px-3 py-1 text-xs font-medium dark:bg-slate-950/40">
                    搜索：{keyword}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 lg:grid-cols-[14rem_12rem_minmax(0,1fr)_10rem]">
                <label className="space-y-2">
                  <span className="text-ledger-text-soft text-xs font-medium">分类过滤</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) => {
                      setSelectedCategory(event.target.value)
                      setPage(1)
                    }}
                    className="border-ledger-border text-ledger-text w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm outline-none dark:bg-slate-950/60"
                  >
                    <option value="">全部分类</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-ledger-text-soft text-xs font-medium">发布状态</span>
                  <select
                    value={selectedStatus}
                    onChange={(event) => {
                      setSelectedStatus(event.target.value as '' | 'draft' | 'published')
                      setPage(1)
                    }}
                    className="border-ledger-border text-ledger-text w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm outline-none dark:bg-slate-950/60"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-ledger-text-soft text-xs font-medium">关键词搜索</span>
                  <input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    placeholder="搜索标题、摘要、标签、作者"
                    className="border-ledger-border text-ledger-text placeholder:text-ledger-text-soft/70 w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm outline-none dark:bg-slate-950/60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-ledger-text-soft text-xs font-medium">每页数量</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    className="border-ledger-border text-ledger-text w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm outline-none dark:bg-slate-950/60"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} 篇 / 页
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-ledger-text-soft rounded-[1.25rem] bg-white/55 px-4 py-3 text-sm dark:bg-slate-950/30">
                第 {page} / {totalPages} 页
              </div>
              <Link
                href="/admin/posts/new"
                className="bg-ledger-accent rounded-full px-4 py-2 text-sm font-semibold text-white"
              >
                新建文章
              </Link>
            </div>
          </div>
        </div>
        {error ? <p className="text-ledger-danger px-6 py-4 text-sm">{error}</p> : null}
        {loading ? (
          <p className="text-ledger-text-soft px-6 py-4 text-sm">正在加载文章...</p>
        ) : null}
        {!loading ? (
          <>
            {posts.length > 0 ? (
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
                          <span className="border-ledger-border text-ledger-text-soft rounded-full border bg-white/60 px-3 py-1 text-xs dark:bg-slate-950/40">
                            {post.category}
                          </span>
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
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-ledger-text text-lg font-semibold">当前条件下没有文章</p>
                <p className="text-ledger-text-soft mt-2 text-sm">
                  试试切换分类，或者新建一篇文章。
                </p>
              </div>
            )}

            <div className="border-ledger-border flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-ledger-text-soft text-sm">
                {total > 0
                  ? `显示第 ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, total)} 篇，共 ${total} 篇`
                  : '当前没有可显示的文章'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page <= 1}
                  className="ledger-chip rounded-full px-4 py-2 text-sm disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                  disabled={page >= totalPages}
                  className="ledger-chip rounded-full px-4 py-2 text-sm disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  )
}
