'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
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
  'border-ledger-border bg-white/80 text-ledger-text placeholder:text-ledger-text-soft/70 focus:border-ledger-accent focus:ring-ledger-accent/20 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 dark:bg-slate-950/60'

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

function PublishBanner({ state }: { state: PublishState | null }) {
  if (!state) return null

  const toneClassName =
    state.status === 'success'
      ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
      : state.status === 'failed'
        ? 'border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
        : state.status === 'running'
          ? 'border-sky-200/80 bg-sky-50/80 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'
          : 'border-ledger-border bg-white/70 text-ledger-text-soft dark:bg-slate-950/50'

  return (
    <div className={`rounded-[1.75rem] border px-5 py-4 text-sm ${toneClassName}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.3em] uppercase">Publish</span>
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

function SectionCard({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <section
      className={`ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border ${
        compact ? 'p-4 md:p-5' : 'p-5 md:p-6'
      }`}
    >
      <div className={`space-y-2 ${compact ? 'mb-4' : 'mb-5'}`}>
        <p className="text-ledger-text-soft text-[11px] font-semibold tracking-[0.3em] uppercase">
          {eyebrow}
        </p>
        <div className="space-y-1">
          <h2 className="text-ledger-text text-xl font-semibold">{title}</h2>
          <p className="text-ledger-text-soft text-sm leading-7">{description}</p>
        </div>
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
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3">
        <span className="text-ledger-text text-sm font-medium">{label}</span>
        {hint ? <span className="text-ledger-text-soft text-xs">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

export default function PostEditor({ adminPath }: PostEditorProps) {
  return (
    <AdminAuthGate>
      {(adminKey) => <PostEditorInner adminKey={adminKey} adminPath={adminPath} />}
    </AdminAuthGate>
  )
}

function PostEditorInner({ adminKey, adminPath }: { adminKey: string; adminPath?: string }) {
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
  const previewHref = resolvedPath ? `/blog/${resolvedPath}` : null

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
      description="将后台编辑页重构为更适合高频写作的工作台：文章目录改为由你选择分类，正文编辑仍然保持主工作区。"
    >
      <section className="ledger-panel border-ledger-border shadow-ledger-sm sticky top-4 z-10 rounded-[2rem] border px-5 py-5 backdrop-blur md:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-ledger-text text-lg font-semibold">{pageTitle}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  hasUnsavedChanges
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                }`}
              >
                {hasUnsavedChanges ? '未保存变更' : '内容已同步'}
              </span>
              <span className="bg-ledger-accent-soft/60 text-ledger-text rounded-full px-3 py-1 text-xs font-semibold">
                {formState.draft ? '草稿模式' : '发布模式'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/admin/posts" className="ledger-chip rounded-full px-4 py-2">
                返回列表
              </Link>
              {previewHref ? (
                <Link href={previewHref} className="ledger-chip rounded-full px-4 py-2">
                  预览前台
                </Link>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 text-sm md:flex-row md:flex-wrap md:items-center md:gap-4">
              <span className="text-ledger-text-soft">
                当前路径：
                <span className="text-ledger-text ml-1 font-medium">
                  {resolvedPath ||
                    `${formState.category || '分类目录'}/${formState.slug || 'slug'}`}
                </span>
              </span>
              <span className="text-ledger-text-soft">
                最近保存：
                <span className="text-ledger-text ml-1 font-medium">
                  {savedAt ? formatDateTimeLabel(savedAt) : '尚未保存'}
                </span>
              </span>
              <span className="text-ledger-text-soft">
                正文统计：
                <span className="text-ledger-text ml-1 font-medium">
                  {bodyWordCount} 词 · 约 {readingMinutes} 分钟
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending || loading}
              onClick={() => savePost(false)}
              className="bg-ledger-accent rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? '保存中...' : '保存草稿'}
            </button>
            <button
              type="button"
              disabled={isPending || loading}
              onClick={() => savePost(true)}
              className="border-ledger-border-strong text-ledger-text rounded-full border bg-white/70 px-5 py-3 text-sm font-semibold disabled:opacity-60 dark:bg-slate-950/40"
            >
              保存并发布
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.75rem] border border-rose-200/80 bg-rose-50/80 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/80 px-5 py-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {info}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {loading ? (
            <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border p-6">
              <p className="text-ledger-text-soft text-sm">正在加载文章...</p>
            </div>
          ) : null}

          {!loading ? (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault()
                savePost(false)
              }}
            >
              <SectionCard
                eyebrow="Quick Setup"
                title="文章信息"
                description="把基础信息与元数据压缩在同一块，并由你明确指定文章分类目录。"
                compact
              >
                <div className="grid gap-4 xl:grid-cols-12">
                  <div className="xl:col-span-6">
                    <Field label="标题" hint="文章主标题">
                      <input
                        value={formState.title}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            title: event.target.value,
                          }))
                        }
                        className={inputClassName}
                        placeholder="输入文章标题"
                      />
                    </Field>
                  </div>

                  <div className="xl:col-span-3">
                    <Field label="分类目录" hint="决定 data/blog 下的目录">
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
                          placeholder="例如：frontend / notes / 2026"
                          required
                        />
                        <datalist id="admin-category-options">
                          {categoryOptions.map((category) => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      </>
                    </Field>
                  </div>

                  <div className="xl:col-span-3">
                    <Field label="发布日期" hint="精确到分钟">
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

                  <div className="xl:col-span-2">
                    <Field label="布局" hint="默认 PostLayout">
                      <input
                        value={formState.layout}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            layout: event.target.value,
                          }))
                        }
                        className={inputClassName}
                      />
                    </Field>
                  </div>

                  <div className="xl:col-span-3">
                    <Field label="Slug" hint={resolvedPath ? '编辑模式已锁定' : '仅新建生效'}>
                      <input
                        value={formState.slug}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            slug: event.target.value,
                          }))
                        }
                        className={inputClassName}
                        placeholder="留空则按标题生成"
                        disabled={Boolean(resolvedPath)}
                      />
                    </Field>
                  </div>

                  <div className="xl:col-span-3">
                    <Field label="标签" hint="逗号分隔">
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
                  </div>

                  <div className="xl:col-span-3">
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
                  </div>

                  <div className="xl:col-span-7">
                    <Field label="摘要" hint="用于列表页与 SEO 摘要">
                      <textarea
                        value={formState.summary}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            summary: event.target.value,
                          }))
                        }
                        rows={2}
                        className={textAreaClassName}
                        placeholder="建议 1-2 句，保持简洁"
                      />
                    </Field>
                  </div>

                  <div className="xl:col-span-5">
                    <div className="border-ledger-border rounded-[1.5rem] border bg-white/55 p-4 dark:bg-slate-950/40">
                      <p className="text-ledger-text text-sm font-semibold">写作状态</p>
                      <label className="text-ledger-text mt-3 flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={formState.draft}
                          onChange={(event) =>
                            setFormState((currentState) => ({
                              ...currentState,
                              draft: event.target.checked,
                            }))
                          }
                          className="border-ledger-border rounded"
                        />
                        保存为草稿
                      </label>
                      <p className="text-ledger-text-soft mt-2 text-xs leading-6">
                        发布时会自动切换为非草稿状态。
                      </p>
                    </div>
                  </div>

                  <div className="xl:col-span-4">
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
                  </div>

                  <div className="xl:col-span-4">
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
                      />
                    </Field>
                  </div>

                  <div className="xl:col-span-4">
                    <Field label="封面 / 图片路径" hint="每行一条">
                      <textarea
                        value={formState.images}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            images: event.target.value,
                          }))
                        }
                        rows={2}
                        className={textAreaClassName}
                        placeholder="/static/images/posts/2026/03/slug/cover.png"
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Editor"
                title="正文编辑"
                description="把正文区作为页面核心工作区，直接专注 MDX 写作和内容组织。"
              >
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-full bg-slate-950 px-3 py-1.5 font-medium text-slate-100">
                    MDX / Markdown
                  </span>
                  <span className="border-ledger-border text-ledger-text-soft rounded-full border bg-white/60 px-3 py-1.5 dark:bg-slate-950/40">
                    {bodyWordCount} 词
                  </span>
                  <span className="border-ledger-border text-ledger-text-soft rounded-full border bg-white/60 px-3 py-1.5 dark:bg-slate-950/40">
                    预计阅读 {readingMinutes} 分钟
                  </span>
                </div>

                <Field label="正文（MDX）" hint="支持直接粘贴图片 Markdown 片段">
                  <textarea
                    value={formState.body}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        body: event.target.value,
                      }))
                    }
                    rows={28}
                    className="border-ledger-border focus:border-ledger-accent focus:ring-ledger-accent/20 min-h-[42rem] w-full rounded-[1.75rem] border bg-slate-950 px-5 py-5 font-mono text-sm leading-7 text-slate-100 transition outline-none focus:ring-4"
                    placeholder="在这里开始写作..."
                  />
                </Field>
              </SectionCard>
            </form>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <PublishBanner state={publishState} />

          <SectionCard
            eyebrow="Assets"
            title="图片上传"
            description="上传后会自动落到文章资源目录，并返回可直接粘贴的 Markdown 片段。"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleUpload(event.target.files?.[0] || null)}
              className="text-ledger-text-soft file:bg-ledger-accent-soft file:text-ledger-text block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2"
            />

            {assetSnippet ? (
              <div className="mt-4 space-y-3">
                <textarea
                  readOnly
                  value={assetSnippet}
                  rows={5}
                  className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 font-mono text-sm dark:bg-slate-950/60"
                />
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="ledger-chip rounded-full px-4 py-2 text-sm"
                >
                  {copiedSnippet ? '已复制 Markdown' : '复制 Markdown 片段'}
                </button>
              </div>
            ) : (
              <p className="text-ledger-text-soft mt-4 text-sm leading-7">
                首次新建文章请先保存，再上传资源文件。
              </p>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Publish"
            title="发布上下文"
            description="集中查看当前文章的路径、保存状态和构建上下文，避免误操作。"
          >
            <ul className="text-ledger-text-soft space-y-3 text-sm leading-7">
              <li>
                分类：
                <span className="text-ledger-text ml-1 font-medium">
                  {formState.category || '待选择'}
                </span>
              </li>
              <li>
                路径：
                <span className="text-ledger-text font-medium">{resolvedPath || '待生成'}</span>
              </li>
              <li>
                文件目录：
                <span className="text-ledger-text ml-1 font-medium">
                  {`data/blog/${formState.category || '分类目录'}/`}
                </span>
              </li>
              <li>
                草稿：
                <span className="text-ledger-text font-medium">
                  {formState.draft ? '是' : '否'}
                </span>
              </li>
              <li>
                最近保存：
                <span className="text-ledger-text ml-1 font-medium">
                  {savedAt ? formatDateTimeLabel(savedAt) : '尚未保存'}
                </span>
              </li>
              <li>
                当前发布目标：
                <span className="text-ledger-text ml-1 font-medium">
                  {publishState?.currentPath || '等待触发'}
                </span>
              </li>
            </ul>
          </SectionCard>

          <SectionCard
            eyebrow="Guide"
            title="目录规范"
            description="保留关键的本地文件约定，但压缩成更易扫读的辅助信息。"
          >
            <ul className="text-ledger-text-soft space-y-2 text-sm leading-7">
              <li>文章：`data/blog/分类目录/slug.mdx`</li>
              <li>图片：`public/static/images/posts/YYYY/MM/slug/*`</li>
              <li>标签、作者支持使用逗号批量录入</li>
              <li>新建文章时需要先指定分类目录，再生成实际路径</li>
            </ul>
          </SectionCard>
        </aside>
      </div>
    </AdminShell>
  )
}
