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

type EditorView = 'editor' | 'preview'

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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
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
  const [editorView, setEditorView] = useState<EditorView>('editor')
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

  return (
    <AdminShell
      title={pageTitle}
      description="左侧沉浸式标题与正文编辑，右侧统一承载发布动作、基础信息和资源上传"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <section className="sticky top-4 z-10 rounded-[2rem] border border-slate-200 bg-white/90 px-5 py-5 shadow-sm backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-950/85">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Link
                  href="/admin/posts"
                  className="inline-flex items-center gap-1 transition hover:text-blue-600 dark:hover:text-sky-300"
                >
                  <span>←</span>
                  <span>返回文章列表</span>
                </Link>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <StatusPill active tone={hasUnsavedChanges ? 'amber' : 'green'}>
                  {hasUnsavedChanges ? '未保存草稿' : '内容已同步'}
                </StatusPill>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  自动保存于 {savedAt ? formatDateTimeLabel(savedAt) : '尚未保存'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill active tone={formState.draft ? 'amber' : 'blue'}>
                  {formState.draft ? '草稿模式' : '发布模式'}
                </StatusPill>
                <StatusPill active tone="neutral">
                  {resolvedPath || '路径待生成'}
                </StatusPill>
                <StatusPill active tone="neutral">
                  {bodyWordCount} 词 / 约 {readingMinutes} 分钟
                </StatusPill>
              </div>
            </div>

            {previewHref ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={previewHref}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  前台预览
                </Link>
              </div>
            ) : null}
          </div>
        </section>

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

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-sm text-slate-500 dark:text-slate-400">正在加载文章内容...</p>
          </div>
        ) : (
          <form
            className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]"
            onSubmit={(event) => {
              event.preventDefault()
              savePost(false)
            }}
          >
            <div className="min-w-0 space-y-6">
              <div className="space-y-4">
                <input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      title: event.target.value,
                    }))
                  }
                  className="w-full border-none bg-transparent px-1 text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300 md:text-5xl dark:text-slate-50 dark:placeholder:text-slate-700"
                  placeholder="输入文章标题..."
                />
                <p className="px-1 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  当前文件预计写入到
                  <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {resolvedPath ? `${resolvedPath}.mdx` : draftFilePath}
                  </span>
                </p>
              </div>

              <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-4 py-3 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditorView('editor')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        editorView === 'editor'
                          ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      MDX 编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView('preview')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        editorView === 'preview'
                          ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-950 dark:text-sky-300'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      实时预览
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <span>{bodyWordCount} 词</span>
                    <span>{bodyLineCount} 行</span>
                    <span>约 {readingMinutes} 分钟阅读</span>
                  </div>
                </div>

                {editorView === 'editor' ? (
                  <MdxCodeEditor
                    value={formState.body}
                    onChange={(value) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        body: value,
                      }))
                    }
                    placeholder="在这里开始输入正文，支持直接粘贴 Markdown 和拖拽图片..."
                  />
                ) : (
                  <PostPreview
                    title={formState.title}
                    summary={formState.summary}
                    body={formState.body}
                  />
                )}
              </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pb-8">
              <SideCard title="发布操作" icon="🚀">
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isPending || loading}
                    onClick={() => savePost(true)}
                    className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    保存并发布
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || loading}
                    className="flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {isPending ? '保存中...' : '保存草稿'}
                  </button>
                </div>
              </SideCard>

              <SideCard
                title="基本信息"
                icon="🧩"
                description="保持与原型一致，把分类、路径和布局收拢到一个紧凑侧栏。"
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

                  <Field
                    label="自定义 Slug URL"
                    hint={resolvedPath ? '编辑模式已锁定' : '留空按标题生成'}
                  >
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
                title="图片与资产"
                icon="🖼️"
                description="上传后自动写入文章资源目录，并返回可直接粘贴的 Markdown 片段。"
              >
                <div className="space-y-4">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10">
                    <span className="text-2xl">⤴</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      点击或拖拽图片到此处
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
              </SideCard>

              <SideCard title="发布上下文" icon="📌">
                <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                  <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-400 dark:text-slate-500">当前路径</p>
                    <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                      {resolvedPath || '待生成'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                      <p className="text-xs text-slate-400 dark:text-slate-500">最近保存</p>
                      <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                        {savedAt ? formatDateTimeLabel(savedAt) : '尚未保存'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                      <p className="text-xs text-slate-400 dark:text-slate-500">图片数</p>
                      <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                        {imageCount}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-400 dark:text-slate-500">发布目标</p>
                    <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                      {publishState?.currentPath || '等待触发'}
                    </p>
                  </div>
                  <PublishBanner state={publishState} />
                </div>
              </SideCard>

              <SideCard title="扩展元数据" icon="🔗">
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
                </div>
              </SideCard>
            </aside>
          </form>
        )}
      </div>
    </AdminShell>
  )
}
