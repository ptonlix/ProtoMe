'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import Image from '@/components/Image'
import siteMetadata from '@/data/siteMetadata'
import { fetchPublishState, publishAllContent } from './api'
import type { PublishState } from './types'

function formatPublishLabel(state: PublishState | null) {
  if (!state || state.status === 'idle') {
    return '尚未触发'
  }

  if (state.status === 'running') {
    return '发布中'
  }

  if (state.status === 'success') {
    return '最近成功'
  }

  return '发布失败'
}

export default function AdminShell({
  adminKey,
  title,
  description,
  onLogout,
  immersive = false,
  children,
}: {
  adminKey?: string
  title: string
  description: string
  onLogout?: () => void
  immersive?: boolean
  children: React.ReactNode
}) {
  const [publishState, setPublishState] = useState<PublishState | null>(null)
  const [publishError, setPublishError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!adminKey || immersive) return

    let active = true
    fetchPublishState(adminKey)
      .then((response) => {
        if (!active) return
        setPublishState(response.publish)
      })
      .catch((error) => {
        if (!active) return
        setPublishError(error instanceof Error ? error.message : '发布状态读取失败')
      })

    return () => {
      active = false
    }
  }, [adminKey, immersive])

  useEffect(() => {
    if (!adminKey || immersive || publishState?.status !== 'running') return

    let active = true
    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetchPublishState(adminKey)
        if (!active) return
        setPublishState(response.publish)
      } catch (error) {
        if (!active) return
        setPublishError(error instanceof Error ? error.message : '发布状态读取失败')
        window.clearInterval(intervalId)
      }
    }, 2000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [adminKey, immersive, publishState?.status])

  const handlePublishAll = () => {
    if (!adminKey) return

    startTransition(async () => {
      try {
        setPublishError('')
        const response = await publishAllContent(adminKey)
        setPublishState(response.publish)
      } catch (error) {
        setPublishError(error instanceof Error ? error.message : '统一发布触发失败')
      }
    })
  }

  return (
    <div className={immersive ? 'space-y-0' : 'space-y-6'}>
      <div
        className={`rounded-[1.75rem] border border-slate-200 bg-white/92 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/78 ${
          immersive ? 'hidden' : ''
        }`}
      >
        <div className="flex flex-col gap-4 px-5 py-4 md:px-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
                <Image src={siteMetadata.siteLogo} alt="ProtoMe logo" width={24} height={24} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
                  <span>Content Admin</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>内容工作台</span>
                </div>
                <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h1>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    ProtoMe
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-900">
                Admin Console
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-600 dark:bg-sky-500/10 dark:text-sky-300">
                Editorial Workspace
              </span>
              {adminKey ? (
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  统一发布：{formatPublishLabel(publishState)}
                </span>
              ) : null}
            </div>

            {publishError ? (
              <p className="text-right text-xs text-rose-600 dark:text-rose-300">{publishError}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/content"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
              >
                内容总览
              </Link>
              <Link
                href="/admin/content/blog/new"
                className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/15"
              >
                新建文章
              </Link>
              {adminKey ? (
                <button
                  type="button"
                  onClick={handlePublishAll}
                  disabled={isPending || publishState?.status === 'running'}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/15"
                >
                  {publishState?.status === 'running'
                    ? '统一发布中...'
                    : isPending
                      ? '提交中...'
                      : '统一发布'}
                </button>
              ) : null}
              <Link
                href="/blog"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                查看前台
              </Link>
              {onLogout ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="ml-1 inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                >
                  退出后台
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
