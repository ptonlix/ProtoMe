'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
import PostPreview from './PostPreview'
import {
  createPost,
  fetchCategories,
  fetchPost,
  fetchPublishState,
  publishPost,
  updatePost,
  uploadAsset,
} from './api'
import type { PublishState } from './types'

const MdxCodeEditor = dynamic(() => import('./MdxCodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[42rem] items-center justify-center px-6 py-6 text-sm text-slate-400 dark:text-slate-500">
      正在加载编辑器…
    </div>
  ),
})

type PostEditorProps = {
  adminPath?: string
}

type FormState = {
  title: string
  category: string
  date: string
  summary: string
  tags: string
  authors: string
  slug: string
  layout: string
  bibliography: string
  canonicalUrl: string
  images: string
  body: string
  draft: boolean
}

type EditorView = 'split' | 'editor' | 'preview'

const defaultFormState: FormState = {
  title: '',
  category: '',
  date: new Date().toISOString().slice(0, 16),
  summary: '',
  tags: '',
  authors: 'default',
  slug: '',
  layout: 'PostLayout',
  bibliography: '',
  canonicalUrl: '',
  images: '',
  body: '',
  draft: true,
}

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500/30 dark:focus:ring-sky-500/10'

const textAreaClassName = `${inputClassName} resize-y`

function formatDateTimeLabel(value: string | null) {
  if (!value) return '暂无记录'

  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toPayload(formState: FormState) {
  return {
    title: formState.title,
    category: formState.category,
    date: formState.date,
    summary: formState.summary,
    tags: formState.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    authors: formState.authors
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    slug: formState.slug,
    layout: formState.layout,
    bibliography: formState.bibliography || undefined,
    canonicalUrl: formState.canonicalUrl || undefined,
    images: formState.images
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    body: formState.body,
    draft: formState.draft,
  }
}

function fromPost(post: Awaited<ReturnType<typeof fetchPost>>['post']): FormState {
  return {
    title: post.title,
    category: post.category,
    date: post.date.slice(0, 16),
    summary: post.summary,
    tags: post.tags.join(', '),
    authors: post.authors.join(', '),
    slug: post.adminPath.split('/').at(-1) || '',
    layout: post.layout,
    bibliography: post.bibliography || '',
    canonicalUrl: post.canonicalUrl || '',
    images: post.images.join('\n'),
    body: post.body,
    draft: post.draft,
  }
}

function StatusPill({
  active,
  children,
  tone = 'neutral',
}: {
  active?: boolean
  children: React.ReactNode
  tone?: 'neutral' | 'amber' | 'green' | 'blue'
}) {
  const toneClassName =
    tone === 'amber'
      ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200'
      : tone === 'green'
        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200'
        : tone === 'blue'
          ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-200'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? `${toneClassName} shadow-sm` : 'bg-transparent text-slate-400'
      }`}
    >
      {children}
    </span>
  )
}

function SideCard({
  title,
  icon,
  description,
  children,
}: {
  title: string
  icon: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white/96 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/72">
      <div className="mb-4 space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          <span className="text-slate-400 dark:text-slate-500">{icon}</span>
          <span>{title}</span>
        </div>
        {description ? (
          <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        {hint ? <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

function PublishBanner({ state }: { state: PublishState | null }) {
  if (!state) return null

  const toneClassName =
    state.status === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
      : state.status === 'failed'
        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
        : state.status === 'running'
          ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'

  return (
    <div className={`rounded-2xl border p-4 text-sm ${toneClassName}`}>
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

function ToolbarButton({
  children,
  tone = 'secondary',
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode
  tone?: 'secondary' | 'primary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const className =
    tone === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : tone === 'ghost'
        ? 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  )
}

function WorkspaceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/75 px-3 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
      <p className="text-[11px] font-medium tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  )
}

export default function PostEditor({ adminPath }: PostEditorProps) {
  return (
    <AdminAuthGate>
      {(adminKey, handleLogout) => (
        <PostEditorInner adminKey={adminKey} adminPath={adminPath} handleLogout={handleLogout} />
      )}
    </AdminAuthGate>
  )
}

function PostEditorInner({
  adminKey,
  adminPath,
  handleLogout,
}: {
  adminKey: string
  adminPath?: string
  handleLogout: () => void
}) {
  const [formState, setFormState] = useState<FormState>(defaultFormState)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [resolvedPath, setResolvedPath] = useState(adminPath || '')
  const [publishState, setPublishState] = useState<PublishState | null>(null)
  const [assetSnippet, setAssetSnippet] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(Boolean(adminPath))
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [editorView, setEditorView] = useState<EditorView>('split')
  const [isImmersive, setIsImmersive] = useState(false)
  const [showImmersiveMeta, setShowImmersiveMeta] = useState(false)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    JSON.stringify(toPayload(defaultFormState))
  )
  const [isPending, startTransition] = useTransition()

  const pageTitle = useMemo(() => (adminPath ? '编辑文章' : '新建文章'), [adminPath])
  const currentSnapshot = useMemo(() => JSON.stringify(toPayload(formState)), [formState])
  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot
  const bodyWordCount = useMemo(() => {
    return formState.body.trim() ? formState.body.trim().split(/\s+/).length : 0
  }, [formState.body])
  const readingMinutes = Math.max(1, Math.ceil(bodyWordCount / 220))
  const bodyLineCount = useMemo(
    () => (formState.body ? formState.body.split('\n').filter(Boolean).length : 0),
    [formState.body]
  )
  const tagCount = useMemo(
    () =>
      formState.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean).length,
    [formState.tags]
  )
  const imageCount = useMemo(
    () =>
      formState.images
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean).length,
    [formState.images]
  )
  const previewHref = resolvedPath ? `/blog/${resolvedPath}` : null
  const draftFilePath = useMemo(() => {
    const slug = formState.slug.trim() || 'slug'
    const category = formState.category.trim() || '分类目录'
    return `data/blog/${category}/${slug}.mdx`
  }, [formState.category, formState.slug])
  const shellDescription = isImmersive
    ? '沉浸模式已启用，仅保留双栏编辑与关键操作。按 Esc 可退出。'
    : '沉浸式双栏工作台，左侧专注写作与预览，右侧收纳发布状态、信息与资源。'

  useEffect(() => {
    let active = true
    Promise.all([
      fetchCategories(adminKey),
      fetchPublishState(adminKey),
      adminPath ? fetchPost(adminKey, adminPath) : Promise.resolve(null),
    ])
      .then(([categoriesResponse, publishResponse, postResponse]) => {
        if (!active) return
        setCategoryOptions(categoriesResponse.categories)
        setPublishState(publishResponse.publish)
        if (postResponse) {
          const nextState = fromPost(postResponse.post)
          setFormState(nextState)
          setResolvedPath(postResponse.post.adminPath)
          setLastSavedSnapshot(JSON.stringify(toPayload(nextState)))
          setSavedAt(postResponse.post.lastmod || postResponse.post.date)
        } else if (categoriesResponse.categories.length > 0) {
          setFormState((currentState) => ({
            ...currentState,
            category: currentState.category || categoriesResponse.categories[0],
          }))
        }
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError instanceof Error ? requestError.message : '文章加载失败')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [adminKey, adminPath])

  useEffect(() => {
    if (!isImmersive) {
      setShowImmersiveMeta(false)
      document.body.classList.remove('admin-immersive')
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImmersive(false)
      }
    }

    document.body.classList.add('admin-immersive')
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('admin-immersive')
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImmersive])

  const savePost = (publishAfterSave: boolean) => {
    startTransition(async () => {
      try {
        setError('')
        setInfo('')
        if (!formState.category.trim()) {
          throw new Error('请先选择或输入文章分类目录')
        }

        const nextFormState = publishAfterSave
          ? {
              ...formState,
              draft: false,
            }
          : formState
        const payload = toPayload(nextFormState)
        const response = resolvedPath
          ? await updatePost(adminKey, resolvedPath, payload)
          : await createPost(adminKey, payload)

        const nextState = fromPost(response.post)
        setFormState(nextState)
        setResolvedPath(response.post.adminPath)
        setLastSavedSnapshot(JSON.stringify(toPayload(nextState)))
        setSavedAt(new Date().toISOString())
        setInfo(`已保存到 ${response.post.adminPath}.mdx`)

        if (publishAfterSave) {
          const publishResponse = await publishPost(adminKey, response.post.adminPath)
          setPublishState(publishResponse.publish)
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
      setError('请先保存文章，再上传图片')
      return
    }

    try {
      setError('')
      const response = await uploadAsset(adminKey, resolvedPath, file)
      setAssetSnippet(response.asset.markdown)
      setFormState((currentState) => ({
        ...currentState,
        images: [response.asset.src, currentState.images].filter(Boolean).join('\n'),
      }))
      setInfo(`图片已上传：${response.asset.src}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '图片上传失败')
    }
  }

  const handleCopySnippet = async () => {
    if (!assetSnippet) return

    try {
      await navigator.clipboard.writeText(assetSnippet)
      setCopiedSnippet(true)
      window.setTimeout(() => setCopiedSnippet(false), 1800)
    } catch {
      setError('复制 Markdown 片段失败，请手动复制')
    }
  }

  const metaSidebar = (
    <div className="space-y-5">
      <SideCard
        title="发布状态"
        icon="🚀"
        description="保存、发布与当前投递状态都集中在这里，保持入口稳定。"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <WorkspaceMetric label="状态" value={formState.draft ? '草稿' : '已发布'} />
            <WorkspaceMetric label="同步" value={hasUnsavedChanges ? '待保存' : '已同步'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <WorkspaceMetric
              label="最近保存"
              value={savedAt ? formatDateTimeLabel(savedAt) : '尚未保存'}
            />
            <WorkspaceMetric label="资源数" value={`${imageCount} 张`} />
          </div>
          <PublishBanner state={publishState} />
        </div>
      </SideCard>

      <SideCard
        title="基本信息"
        icon="🧩"
        description="分类、Slug、布局与发布时间采用紧凑排布，保持侧栏轻量。"
      >
        <div className="space-y-4">
          <Field label="文章目录（分类）">
            <>
              <input
                list="admin-category-options"
                value={formState.category}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    category: event.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="例如：notes / tech / essays"
                required
              />
              <datalist id="admin-category-options">
                {categoryOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </>
          </Field>

          <Field label="自定义 Slug URL" hint={resolvedPath ? '编辑模式已锁定' : '留空按标题生成'}>
            <input
              value={formState.slug}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  slug: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="my-new-post"
              disabled={Boolean(resolvedPath)}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Field label="页面布局">
              <input
                value={formState.layout}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    layout: event.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="PostLayout"
              />
            </Field>

            <Field label="发布日期">
              <input
                type="datetime-local"
                value={formState.date}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    date: event.target.value,
                  }))
                }
                className={inputClassName}
              />
            </Field>
          </div>
        </div>
      </SideCard>

      <SideCard title="摘要与标签" icon="🏷️">
        <div className="space-y-4">
          <Field label="标签 Tags" hint={`${tagCount} 个`}>
            <input
              value={formState.tags}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  tags: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="design, admin"
            />
          </Field>

          <Field label="作者" hint="逗号分隔">
            <input
              value={formState.authors}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  authors: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="default"
            />
          </Field>

          <Field label="文章摘要">
            <textarea
              value={formState.summary}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  summary: event.target.value,
                }))
              }
              rows={4}
              className={textAreaClassName}
              placeholder="用于列表页与 SEO 摘要，建议 1-2 句"
            />
          </Field>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formState.draft}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  draft: event.target.checked,
                }))
              }
              className="mt-1 rounded border-slate-300 dark:border-slate-700"
            />
            <span className="leading-6">
              保持为草稿。点击“保存并发布”时会自动切换为已发布状态。
            </span>
          </label>
        </div>
      </SideCard>

      <SideCard
        title="扩展元数据"
        icon="🔗"
        description="摘要外的引用配置、资源路径和图片片段都收纳到同一列。"
      >
        <div className="space-y-4">
          <Field label="Canonical URL" hint="可留空">
            <input
              value={formState.canonicalUrl}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  canonicalUrl: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="https://example.com/post"
            />
          </Field>

          <Field label="参考文献文件" hint="可留空">
            <input
              value={formState.bibliography}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  bibliography: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="references.bib"
            />
          </Field>

          <Field label="封面 / 图片路径" hint="每行一条">
            <textarea
              value={formState.images}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  images: event.target.value,
                }))
              }
              rows={4}
              className={textAreaClassName}
              placeholder="/static/images/posts/2026/03/slug/cover.png"
            />
          </Field>

          <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
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
              <div className="space-y-3">
                <textarea
                  readOnly
                  value={assetSnippet}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  {copiedSnippet ? '已复制 Markdown' : '复制 Markdown 片段'}
                </button>
              </div>
            ) : (
              <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
                首次新建文章请先保存，再上传资源文件。
              </p>
            )}
          </div>
        </div>
      </SideCard>
    </div>
  )

  const workspaceLayout = (
    <div
      className={`relative ${
        isImmersive
          ? 'fixed inset-0 z-[200] h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.35),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_48%,_#f8fafc_100%)] px-1.5 py-1.5 sm:px-3 sm:py-3 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.1),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_50%,_#020617_100%)]'
          : 'left-1/2 w-screen -translate-x-1/2 px-4 sm:px-6 xl:px-8 2xl:px-10'
      }`}
    >
      {loading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
          <p className="text-sm text-slate-500 dark:text-slate-400">正在加载文章内容...</p>
        </div>
      ) : (
        <form
          className={`${
            isImmersive
              ? 'flex h-[calc(100dvh-0.75rem)] w-full flex-col pb-15 sm:h-[calc(100dvh-1.5rem)]'
              : 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]'
          }`}
          onSubmit={(event) => {
            event.preventDefault()
            savePost(false)
          }}
        >
          <div
            className={`min-w-0 ${
              isImmersive
                ? 'flex h-full min-h-0 w-full flex-1 flex-col rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_30px_120px_-60px_rgba(37,99,235,0.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/78'
                : 'space-y-6'
            }`}
          >
            {error ? (
              <div className="mx-1 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            ) : null}

            {info ? (
              <div className="mx-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {info}
              </div>
            ) : null}

            <section
              className={`overflow-hidden ${
                isImmersive
                  ? 'flex h-full min-h-0 flex-col rounded-[2rem]'
                  : 'rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.28),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.98)_100%)] shadow-[0_20px_80px_-50px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,_rgba(2,6,23,0.92)_0%,_rgba(15,23,42,0.92)_100%)]'
              }`}
            >
              <div className="border-b border-slate-200/70 bg-white/70 px-4 py-4 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-950/65">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      {!isImmersive ? (
                        <>
                          <Link
                            href="/admin/posts"
                            className="inline-flex items-center gap-1 transition hover:text-blue-600 dark:hover:text-sky-300"
                          >
                            <span>←</span>
                            <span>返回文章列表</span>
                          </Link>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                        </>
                      ) : null}
                      <StatusPill active tone={hasUnsavedChanges ? 'amber' : 'green'}>
                        {hasUnsavedChanges ? '未保存草稿' : '内容已同步'}
                      </StatusPill>
                      <StatusPill active tone={formState.draft ? 'amber' : 'blue'}>
                        {formState.draft ? '草稿模式' : '发布模式'}
                      </StatusPill>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        自动保存于 {savedAt ? formatDateTimeLabel(savedAt) : '尚未保存'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill active tone="neutral">
                        {resolvedPath || '路径待生成'}
                      </StatusPill>
                      <StatusPill active tone="neutral">
                        {bodyWordCount} 词 / 约 {readingMinutes} 分钟
                      </StatusPill>
                      <StatusPill active tone="neutral">
                        {bodyLineCount} 行
                      </StatusPill>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isImmersive ? (
                      <ToolbarButton
                        tone="ghost"
                        onClick={() => setShowImmersiveMeta((currentState) => !currentState)}
                      >
                        {showImmersiveMeta ? '收起设置' : '元数据设置'}
                      </ToolbarButton>
                    ) : null}
                    {previewHref ? (
                      <Link
                        href={previewHref}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        前台预览
                      </Link>
                    ) : null}
                    <ToolbarButton type="submit" disabled={isPending || loading}>
                      {isPending ? '保存中...' : '保存草稿'}
                    </ToolbarButton>
                    <ToolbarButton
                      tone="primary"
                      disabled={isPending || loading}
                      onClick={() => savePost(true)}
                    >
                      保存并发布
                    </ToolbarButton>
                    <ToolbarButton
                      tone="ghost"
                      onClick={() => setIsImmersive((currentState) => !currentState)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <svg
                          viewBox="0 0 20 20"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          {isImmersive ? (
                            <path d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" />
                          ) : (
                            <path d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4M8 8 3 3M12 8l5-5M12 12l5 5M8 12l-5 5" />
                          )}
                        </svg>
                        <span>{isImmersive ? '退出沉浸' : '拓展全面'}</span>
                      </span>
                    </ToolbarButton>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.3em] text-slate-400 uppercase dark:text-slate-500">
                      <span>Editorial Suite</span>
                    </div>
                    <input
                      value={formState.title}
                      onChange={(event) =>
                        setFormState((currentState) => ({
                          ...currentState,
                          title: event.target.value,
                        }))
                      }
                      className="w-full border-none bg-transparent p-0 text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300 md:text-5xl dark:text-slate-50 dark:placeholder:text-slate-700"
                      placeholder="输入文章标题..."
                    />
                    <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                      当前文件预计写入到
                      <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {resolvedPath ? `${resolvedPath}.mdx` : draftFilePath}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/40 dark:bg-slate-900/30">
                <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-800">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditorView('split')}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        editorView === 'split'
                          ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      双栏
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView('editor')}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        editorView === 'editor'
                          ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView('preview')}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        editorView === 'preview'
                          ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      实时预览
                    </button>
                  </div>
                </div>

                <div
                  className={`grid h-full min-h-0 flex-1 overflow-hidden ${
                    editorView === 'split' ? 'xl:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  <div
                    className={`min-h-[26rem] overflow-hidden border-b border-slate-200/70 xl:min-h-0 xl:border-r xl:border-b-0 dark:border-slate-800 ${
                      editorView === 'preview' ? 'hidden' : ''
                    }`}
                  >
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.28em] text-slate-400 uppercase dark:text-slate-500">
                            Editor
                          </p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            专注正文输入，保留源码写作节奏。
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                          <span>{bodyWordCount} 词</span>
                          <span>{bodyLineCount} 行</span>
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95)_0%,_rgba(248,250,252,0.95)_100%)] dark:bg-[linear-gradient(180deg,_rgba(2,6,23,0.2)_0%,_rgba(15,23,42,0.12)_100%)]">
                        <MdxCodeEditor
                          value={formState.body}
                          onChange={(value) =>
                            setFormState((currentState) => ({
                              ...currentState,
                              body: value,
                            }))
                          }
                          immersive={isImmersive}
                          placeholder="在这里开始输入正文，支持直接粘贴 Markdown 和拖拽图片..."
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`min-h-[26rem] overflow-hidden xl:min-h-0 ${
                      editorView === 'editor' ? 'hidden' : ''
                    }`}
                  >
                    <div className="flex h-full min-h-0 flex-col bg-white/75 dark:bg-slate-950/45">
                      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.28em] text-slate-400 uppercase dark:text-slate-500">
                            Preview
                          </p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            与前台更接近的实时渲染，便于边写边校对。
                          </p>
                        </div>
                        <div className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          {readingMinutes} 分钟阅读
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 overflow-hidden">
                        <PostPreview
                          title={formState.title}
                          summary={formState.summary}
                          body={formState.body}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {isImmersive ? (
            <>
              {showImmersiveMeta ? (
                <button
                  type="button"
                  className="fixed inset-0 z-[210] bg-slate-950/30 backdrop-blur-sm"
                  onClick={() => setShowImmersiveMeta(false)}
                  aria-label="关闭沉浸模式设置面板遮罩"
                />
              ) : null}

              <aside
                className={`fixed top-3 right-3 z-[220] h-[calc(100vh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-[2rem] border border-white/70 bg-white/88 p-4 shadow-[0_30px_120px_-70px_rgba(15,23,42,0.9)] backdrop-blur-xl transition duration-300 dark:border-slate-800 dark:bg-slate-950/88 ${
                  showImmersiveMeta
                    ? 'translate-x-0 opacity-100'
                    : 'pointer-events-none translate-x-[110%] opacity-0'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.28em] text-slate-400 uppercase dark:text-slate-500">
                      Metadata
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      保留发布、摘要和资源设置，不打断写作流。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImmersiveMeta(false)}
                    className="rounded-full px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                  >
                    关闭
                  </button>
                </div>
                {metaSidebar}
              </aside>
            </>
          ) : (
            <aside className="space-y-5 xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pb-8">
              {metaSidebar}
            </aside>
          )}
        </form>
      )}
    </div>
  )

  return (
    <AdminShell
      title={pageTitle}
      description={shellDescription}
      onLogout={handleLogout}
      immersive={isImmersive}
    >
      {workspaceLayout}
    </AdminShell>
  )
}
