'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
import { fetchContents } from './api'
import { getContentConfig } from './content-config'
import type { AdminContentItem, ContentTypeKey, StatusTone } from './types'

const pageSizeOptions = [10, 20, 50]

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const className =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
      : tone === 'green'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
        : tone === 'blue'
          ? 'bg-blue-100 text-blue-800 dark:bg-sky-500/15 dark:text-sky-200'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>
  )
}

export default function ContentIndex({ typeKey }: { typeKey: ContentTypeKey }) {
  return (
    <AdminAuthGate>
      {(adminKey, handleLogout) => (
        <ContentIndexInner adminKey={adminKey} handleLogout={handleLogout} typeKey={typeKey} />
      )}
    </AdminAuthGate>
  )
}

function ContentIndexInner({
  adminKey,
  handleLogout,
  typeKey,
}: {
  adminKey: string
  handleLogout: () => void
  typeKey: ContentTypeKey
}) {
  const config = getContentConfig(typeKey)
  const searchParams = useSearchParams()
  const [items, setItems] = useState<AdminContentItem[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deletedFlag = searchParams.get('deleted')

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

    fetchContents(adminKey, typeKey, {
      keyword: keyword || undefined,
      status: selectedStatus || undefined,
      group: selectedGroup || undefined,
      page,
      pageSize,
    })
      .then((response) => {
        if (!active) return
        setItems(response.items)
        setGroups(response.availableGroups)
        setTotal(response.total)
        setTotalPages(response.totalPages)
        setPage(response.page)
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
  }, [adminKey, typeKey, keyword, selectedStatus, selectedGroup, page, pageSize])

  return (
    <AdminShell
      adminKey={adminKey}
      title={config.label}
      description={config.description}
      onLogout={handleLogout}
    >
      <div className="rounded-[2rem] border border-slate-200 bg-white/92 shadow-sm dark:border-slate-800 dark:bg-slate-950/72">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {config.navLabel} 列表
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  共 {total} 条
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_10rem]">
                <label className="space-y-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    关键词搜索
                  </span>
                  <input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    placeholder={config.keywordPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950/60"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {config.statusFilterLabel || '状态'}
                  </span>
                  <select
                    value={selectedStatus}
                    onChange={(event) => {
                      setSelectedStatus(event.target.value)
                      setPage(1)
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    {config.statusOptions.map((option) => (
                      <option key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {config.groupFilterLabel || '分组'}
                  </span>
                  <select
                    value={selectedGroup}
                    onChange={(event) => {
                      setSelectedGroup(event.target.value)
                      setPage(1)
                    }}
                    disabled={!config.groupFilterLabel}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <option value="">全部</option>
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    每页数量
                  </span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} 条 / 页
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                第 {page} / {totalPages} 页
              </div>
              {config.mode === 'collection' ? (
                <Link
                  href={`/admin/content/${typeKey}/new`}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  {config.newLabel}
                </Link>
              ) : (
                <Link
                  href={`/admin/content/${typeKey}`}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  进入编辑
                </Link>
              )}
            </div>
          </div>
        </div>

        {error ? <p className="px-6 py-4 text-sm text-rose-600">{error}</p> : null}
        {deletedFlag ? (
          <p className="px-6 py-4 text-sm text-amber-700 dark:text-amber-300">
            内容与资源目录已删除。
          </p>
        ) : null}
        {loading ? <p className="px-6 py-4 text-sm text-slate-500">正在加载内容...</p> : null}

        {!loading ? (
          <>
            {items.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((item) => (
                  <Link
                    key={`${item.type}:${item.adminPath}`}
                    href={`/admin/content/${typeKey}/${item.adminPath}`}
                    className="block px-6 py-5 transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            {item.title}
                          </h3>
                          <StatusPill
                            label={item.displayStatus.label}
                            tone={item.displayStatus.tone}
                          />
                          {item.group ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                              {item.group.label}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                          {item.summary || '暂无摘要'}
                        </p>
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          路径：{item.adminPath}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  当前条件下没有内容
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  试试切换筛选条件，或者直接创建一条新的内容。
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {total > 0
                  ? `显示第 ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, total)} 条，共 ${total} 条`
                  : '当前没有可显示的内容'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-50 dark:border-slate-800"
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-50 dark:border-slate-800"
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
