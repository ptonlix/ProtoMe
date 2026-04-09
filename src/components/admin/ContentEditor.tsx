'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
import PostPreview from './PostPreview'
import {
  createContentItem,
  deleteContentItem,
  fetchContentItem,
  fetchPublishState,
  publishContentItem,
  updateContentItem,
  uploadContentAsset,
} from './api'
import { getContentConfig, type ContentFieldConfig, type ContentFormState } from './content-config'
import type { ContentTypeKey, PublishState, StatusTone } from './types'

const MdxCodeEditor = dynamic(() => import('./MdxCodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[28rem] items-center justify-center px-6 py-6 text-sm text-slate-400 dark:text-slate-500">
      正在加载编辑器…
    </div>
  ),
})

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500/30 dark:focus:ring-sky-500/10'

const PUBLISH_SUCCESS_VISIBLE_MS = 8000

function formatDateTimeLabel(value: string | null) {
  if (!value) return '暂无记录'
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizePublishState(state: PublishState | null) {
  if (!state || state.status === 'idle') return null
  if (state.status !== 'success') return state

  const finishedAt = state.finishedAt ? new Date(state.finishedAt).getTime() : Number.NaN
  if (Number.isNaN(finishedAt)) return null

  return Date.now() - finishedAt < PUBLISH_SUCCESS_VISIBLE_MS ? state : null
}

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

function PublishBanner({ state }: { state: PublishState | null }) {
  if (!state) return null

  const className =
    state.status === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
      : state.status === 'failed'
        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
        : state.status === 'running'
          ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'

  return (
    <div className={`rounded-2xl border p-4 text-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.28em] uppercase">Publish</span>
        <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold capitalize dark:bg-white/10">
          {state.status}
        </span>
      </div>
      <p className="mt-3 leading-6">{state.message}</p>
      <div className="mt-3 flex flex-wrap gap-4 text-xs opacity-80">
        <span>开始：{formatDateTimeLabel(state.startedAt)}</span>
        <span>结束：{formatDateTimeLabel(state.finishedAt)}</span>
      </div>
    </div>
  )
}

function ImmersiveButton({
  active,
  panelOpen,
  onClick,
}: {
  active: boolean
  panelOpen: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? (panelOpen ? '隐藏辅助面板' : '显示辅助面板') : '进入沉浸编辑模式'}
      title={active ? (panelOpen ? '隐藏辅助面板' : '显示辅助面板') : '进入沉浸编辑模式'}
      className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900'
      }`}
    >
      {active ? (panelOpen ? '隐藏侧栏' : '显示侧栏') : '沉浸编辑'}
    </button>
  )
}

function renderField(
  field: ContentFieldConfig,
  state: ContentFormState,
  setState: React.Dispatch<React.SetStateAction<ContentFormState>>,
  disabled: boolean
) {
  const value = state[field.key]

  if (field.kind === 'checkbox') {
    return (
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              [field.key]: event.target.checked,
            }))
          }
          disabled={disabled}
          className="mt-1 rounded border-slate-300 dark:border-slate-700"
        />
        <span className="leading-6">{field.label}</span>
      </label>
    )
  }

  if (field.kind === 'select') {
    return (
      <select
        value={String(value ?? '')}
        onChange={(event) =>
          setState((current) => ({
            ...current,
            [field.key]: event.target.value,
          }))
        }
        disabled={disabled}
        className={inputClassName}
      >
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (field.kind === 'textarea' || field.kind === 'newline-list') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={(event) =>
          setState((current) => ({
            ...current,
            [field.key]: event.target.value,
          }))
        }
        rows={field.kind === 'textarea' ? 4 : 5}
        disabled={disabled}
        className={`${inputClassName} resize-y`}
        placeholder={field.placeholder}
      />
    )
  }

  return (
    <input
      type={field.kind === 'datetime-local' ? 'datetime-local' : 'text'}
      value={String(value ?? '')}
      onChange={(event) =>
        setState((current) => ({
          ...current,
          [field.key]: event.target.value,
        }))
      }
      disabled={disabled}
      className={inputClassName}
      placeholder={field.placeholder}
    />
  )
}

export default function ContentEditor({
  typeKey,
  adminPath,
}: {
  typeKey: ContentTypeKey
  adminPath?: string
}) {
  return (
    <AdminAuthGate>
      {(adminKey, handleLogout) => (
        <ContentEditorInner
          adminKey={adminKey}
          handleLogout={handleLogout}
          typeKey={typeKey}
          adminPath={adminPath}
        />
      )}
    </AdminAuthGate>
  )
}

function ContentEditorInner({
  adminKey,
  handleLogout,
  typeKey,
  adminPath,
}: {
  adminKey: string
  handleLogout: () => void
  typeKey: ContentTypeKey
  adminPath?: string
}) {
  const config = getContentConfig(typeKey)
  const [formState, setFormState] = useState<ContentFormState>(() => config.createInitialState())
  const [resolvedPath, setResolvedPath] = useState(adminPath || '')
  const [publishState, setPublishState] = useState<PublishState | null>(null)
  const [assetSnippet, setAssetSnippet] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(adminPath) || config.mode === 'singleton')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    JSON.stringify(config.toPayload(config.createInitialState()))
  )
  const [editorView, setEditorView] = useState<'split' | 'editor' | 'preview'>('split')
  const [immersive, setImmersive] = useState(false)
  const [immersiveSidebarOpen, setImmersiveSidebarOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const payloadSnapshot = useMemo(
    () => JSON.stringify(config.toPayload(formState)),
    [config, formState]
  )
  const hasUnsavedChanges = payloadSnapshot !== lastSavedSnapshot
  const previewTitle = config.getPreviewTitle(formState)
  const previewSummary = config.getPreviewSummary(formState)
  const body = String(formState[config.bodyField] ?? '')
  const previewHref = resolvedPath
    ? typeKey === 'blog'
      ? `/blog/${resolvedPath}`
      : typeKey === 'profile'
        ? '/profile'
        : typeKey === 'about'
          ? '/about'
          : typeKey === 'project'
            ? '/projects'
            : typeKey === 'worklog'
              ? '/worklogs'
              : null
    : config.mode === 'singleton'
      ? typeKey === 'profile'
        ? '/profile'
        : typeKey === 'about'
          ? '/about'
          : null
      : null
  const bodyWordCount = useMemo(() => (body.trim() ? body.trim().split(/\s+/).length : 0), [body])
  const draftPath = config.getDraftPath(formState, resolvedPath)
  const statusLabel = useMemo(() => {
    const privacy = String(formState.privacy || '')
    if (typeKey === 'blog') {
      return formState.draft
        ? { label: '草稿', tone: 'amber' as StatusTone }
        : { label: '已发布', tone: 'green' as StatusTone }
    }
    if (typeKey === 'project') {
      const status = String(formState.status || 'idea')
      return {
        label:
          status === 'active'
            ? '进行中'
            : status === 'paused'
              ? '暂停'
              : status === 'completed'
                ? '已完成'
                : status === 'archived'
                  ? '已归档'
                  : '想法',
        tone:
          status === 'active'
            ? 'blue'
            : status === 'completed'
              ? 'green'
              : status === 'paused'
                ? 'amber'
                : ('neutral' as StatusTone),
      }
    }

    return {
      label: privacy === 'private' ? '私有' : privacy === 'restricted' ? '受限' : '公开',
      tone:
        privacy === 'public'
          ? ('green' as StatusTone)
          : privacy === 'restricted'
            ? ('amber' as StatusTone)
            : ('neutral' as StatusTone),
    }
  }, [formState, typeKey])

  useEffect(() => {
    let active = true

    Promise.all([
      fetchPublishState(adminKey),
      adminPath || config.mode === 'singleton'
        ? fetchContentItem(adminKey, typeKey, adminPath)
        : Promise.resolve(null),
    ])
      .then(([publishResponse, itemResponse]) => {
        if (!active) return
        setPublishState(normalizePublishState(publishResponse.publish))

        if (itemResponse) {
          const nextState = config.fromItem(itemResponse.item)
          setFormState(nextState)
          setResolvedPath(itemResponse.item.adminPath)
          setSavedAt(itemResponse.item.lastmod || itemResponse.item.updatedAt || null)
          setLastSavedSnapshot(JSON.stringify(config.toPayload(nextState)))
        }
      })
      .catch((requestError) => {
        if (!active) return
        const message = requestError instanceof Error ? requestError.message : '内容加载失败'
        if (config.mode === 'singleton' && /(ENOENT|no such file|不存在)/i.test(message)) {
          setError('')
          return
        }
        setError(message)
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [adminKey, adminPath, config, typeKey])

  useEffect(() => {
    if (publishState?.status !== 'running') return

    let active = true
    const intervalId = window.setInterval(async () => {
      try {
        const publishResponse = await fetchPublishState(adminKey)
        if (!active) return
        setPublishState(normalizePublishState(publishResponse.publish))
      } catch {
        if (!active) return
        window.clearInterval(intervalId)
      }
    }, 2000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [adminKey, publishState?.status])

  useEffect(() => {
    if (publishState?.status !== 'success' || !publishState.finishedAt) return

    const finishedAt = new Date(publishState.finishedAt).getTime()
    if (Number.isNaN(finishedAt)) {
      setPublishState(null)
      return
    }

    const remainingMs = Math.max(PUBLISH_SUCCESS_VISIBLE_MS - (Date.now() - finishedAt), 0)
    const timeoutId = window.setTimeout(() => {
      setPublishState((current) => (current?.status === 'success' ? null : current))
    }, remainingMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [publishState])

  useEffect(() => {
    if (!immersive) return

    document.body.classList.add('admin-immersive')
    setImmersiveSidebarOpen(true)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setImmersive(false)
        setImmersiveSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('admin-immersive')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [immersive])

  const saveContent = (publishAfterSave: boolean) => {
    startTransition(async () => {
      try {
        setError('')
        setInfo('')

        const nextState =
          publishAfterSave && typeKey === 'blog'
            ? {
                ...formState,
                draft: false,
              }
            : formState

        const payload = config.toPayload(nextState)
        const response = resolvedPath
          ? await updateContentItem(adminKey, typeKey, resolvedPath, payload)
          : await createContentItem(adminKey, typeKey, payload)

        const normalizedState = config.fromItem(response.item)
        setFormState(normalizedState)
        setResolvedPath(response.item.adminPath)
        setSavedAt(new Date().toISOString())
        setLastSavedSnapshot(JSON.stringify(config.toPayload(normalizedState)))
        setInfo(`已保存到 ${response.item.filePath}`)

        if (publishAfterSave) {
          const publishResponse = await publishContentItem(
            adminKey,
            typeKey,
            response.item.adminPath
          )
          setPublishState(normalizePublishState(publishResponse.publish))
          setInfo(`已触发发布：${publishResponse.publish.message}`)
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '保存失败')
      }
    })
  }

  const handleUpload = async (file: File | null) => {
    if (!file) return
    if (!resolvedPath) {
      setError('请先保存内容，再上传资源')
      return
    }

    try {
      setError('')
      const response = await uploadContentAsset(adminKey, typeKey, resolvedPath, file)
      setAssetSnippet(response.asset.markdown)
      setInfo(`资源已上传：${response.asset.src}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '资源上传失败')
    }
  }

  const handleDelete = async () => {
    if (!resolvedPath) return

    const confirmed = window.confirm(
      `确认删除“${previewTitle}”吗？\n\n这会同时删除内容文件和该内容关联的资源目录。\n删除后不会自动发布，请稍后统一执行发布。`
    )
    if (!confirmed) return

    try {
      setIsDeleting(true)
      setError('')
      setInfo('')
      await deleteContentItem(adminKey, typeKey, resolvedPath)
      window.location.assign(`/admin/content/${typeKey}?deleted=1`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '删除失败')
      setIsDeleting(false)
    }
  }

  const fieldList = config.fields.filter((field) => field.key !== config.bodyField)
  const closeImmersive = () => {
    setImmersive(false)
    setImmersiveSidebarOpen(false)
  }
  const openImmersive = () => {
    setImmersive(true)
    setImmersiveSidebarOpen(true)
  }
  const renderSidebar = (compact = false) => (
    <>
      <section
        className={`rounded-[1.6rem] border border-slate-200 bg-white/96 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/72 ${
          compact ? 'backdrop-blur' : ''
        }`}
      >
        <div className="mb-4 space-y-1.5">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">发布状态</div>
          <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
            保存、发布和当前状态都会集中显示在这里。
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
                状态
              </p>
              <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">
                {statusLabel.label}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
                正文
              </p>
              <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">
                {bodyWordCount} 词
              </p>
            </div>
          </div>
          <PublishBanner state={publishState} />
        </div>
      </section>

      <section
        className={`rounded-[1.6rem] border border-slate-200 bg-white/96 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/72 ${
          compact ? 'backdrop-blur' : ''
        }`}
      >
        <div className="mb-4 space-y-1.5">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">字段设置</div>
          <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
            当前内容类型的结构化字段统一维护在这里。
          </p>
        </div>
        <div className="space-y-4">
          {fieldList.map((field) => (
            <label key={field.key} className="block space-y-1.5">
              <span className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {field.label}
                </span>
                {field.hint ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500">{field.hint}</span>
                ) : null}
              </span>
              {renderField(
                field,
                formState,
                setFormState,
                Boolean(resolvedPath) && ['slug', 'pathSlug'].includes(field.key)
              )}
            </label>
          ))}
        </div>
      </section>

      {config.supportsAssets ? (
        <section
          className={`rounded-[1.6rem] border border-slate-200 bg-white/96 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/72 ${
            compact ? 'backdrop-blur' : ''
          }`}
        >
          <div className="mb-4 space-y-1.5">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">资源上传</div>
            <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
              首次新建内容请先保存，再上传资源文件。
            </p>
          </div>
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10">
              <span className="text-2xl">⤴</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                拖拽或点击上传图片资源
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleUpload(event.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            {assetSnippet ? (
              <textarea
                readOnly
                value={assetSnippet}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  )
  const editorSection = (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/72 ${
        immersive ? 'min-h-full border-slate-300/80 shadow-2xl dark:border-slate-700' : ''
      }`}
    >
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <StatusPill label={statusLabel.label} tone={statusLabel.tone} />
              <span>{hasUnsavedChanges ? '存在未保存修改' : '内容已同步'}</span>
              <span>最近保存：{savedAt ? formatDateTimeLabel(savedAt) : '尚未保存'}</span>
              {immersive ? <span className="text-xs">Esc 退出沉浸模式</span> : null}
            </div>
            <input
              value={String(formState[config.titleField] ?? '')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [config.titleField]: event.target.value,
                }))
              }
              className="w-full min-w-0 border-none bg-transparent p-0 text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300 dark:text-slate-50 dark:placeholder:text-slate-700"
              placeholder={`输入${config.navLabel}标题...`}
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              当前文件预计写入到
              <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {draftPath}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <ImmersiveButton
              active={immersive}
              panelOpen={immersiveSidebarOpen}
              onClick={() =>
                immersive ? setImmersiveSidebarOpen((current) => !current) : openImmersive()
              }
            />
            {previewHref ? (
              <Link
                href={previewHref}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                前台预览
              </Link>
            ) : null}
            {immersive ? (
              <button
                type="button"
                onClick={closeImmersive}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                退出沉浸
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => saveContent(false)}
              disabled={isPending || isDeleting || loading}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isPending ? '保存中...' : '保存内容'}
            </button>
            <button
              type="button"
              onClick={() => saveContent(true)}
              disabled={isPending || isDeleting || loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              保存并发布
            </button>
            {config.mode === 'collection' && resolvedPath ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || isDeleting || loading}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
              >
                {isDeleting ? '删除中...' : '删除内容'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">正在加载内容...</div>
      ) : (
        <>
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              {(['split', 'editor', 'preview'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setEditorView(view)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    editorView === view
                      ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-sky-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {view === 'split' ? '双栏' : view === 'editor' ? '编辑' : '预览'}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`grid ${
              immersive
                ? `min-h-[56vh] xl:h-[calc(100vh-18rem)] xl:min-h-[42rem] ${
                    editorView === 'split' ? 'xl:grid-cols-2' : 'grid-cols-1'
                  }`
                : `min-h-[34rem] ${editorView === 'split' ? 'xl:grid-cols-2' : 'grid-cols-1'}`
            }`}
          >
            <div
              className={`${editorView === 'preview' ? 'hidden' : ''} min-h-[24rem] overflow-hidden border-b border-slate-200 xl:border-r xl:border-b-0 dark:border-slate-800`}
            >
              <MdxCodeEditor
                value={body}
                onChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    [config.bodyField]: value,
                  }))
                }
                placeholder="在这里开始输入 Markdown 或 MDX 正文..."
                immersive={immersive}
              />
            </div>
            <div
              className={`${editorView === 'editor' ? 'hidden' : ''} min-h-[24rem] overflow-hidden`}
            >
              <PostPreview title={previewTitle} summary={previewSummary} body={body} />
            </div>
          </div>
        </>
      )}
    </section>
  )

  return (
    <AdminShell
      adminKey={adminKey}
      title={resolvedPath ? `编辑 ${config.navLabel}` : config.newLabel}
      description={config.description}
      onLogout={handleLogout}
      immersive={immersive}
    >
      {immersive ? (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-slate-100/95 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-6 dark:bg-slate-950/94">
          <div className="mx-auto min-h-full max-w-[1800px] pb-28">
            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            ) : null}
            {info ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {info}
              </div>
            ) : null}

            <div className="relative">
              {editorSection}

              <div
                className={`fixed inset-y-4 right-4 z-20 w-[min(26rem,calc(100vw-2rem))] transform transition duration-200 sm:right-6 ${
                  immersiveSidebarOpen
                    ? 'translate-x-0 opacity-100'
                    : 'pointer-events-none translate-x-[110%] opacity-0'
                }`}
              >
                <div className="admin-scrollbar h-full overflow-y-auto rounded-[2rem] border border-slate-200 bg-white/96 p-4 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/88">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
                        Sidebar
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                        编辑辅助面板
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImmersiveSidebarOpen(false)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    >
                      收起
                    </button>
                  </div>
                  <div className="space-y-5">{renderSidebar(true)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}
          {info ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {info}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            {editorSection}
            <aside className="space-y-5">{renderSidebar()}</aside>
          </div>
        </>
      )}
    </AdminShell>
  )
}
