'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
import {
  createPost,
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

function toPayload(formState: FormState) {
  return {
    title: formState.title,
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
  return (
    <div className="border-ledger-border bg-ledger-panel text-ledger-text-soft rounded-3xl border px-4 py-3 text-sm">
      发布状态：<span className="text-ledger-text font-semibold">{state.status}</span> ·{' '}
      {state.message}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-ledger-text text-sm font-medium">{label}</span>
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
  const [resolvedPath, setResolvedPath] = useState(adminPath || '')
  const [publishState, setPublishState] = useState<PublishState | null>(null)
  const [assetSnippet, setAssetSnippet] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(Boolean(adminPath))
  const [isPending, startTransition] = useTransition()

  const pageTitle = useMemo(() => (adminPath ? '编辑文章' : '新建文章'), [adminPath])

  useEffect(() => {
    let active = true
    Promise.all([
      fetchPublishState(adminKey),
      adminPath ? fetchPost(adminKey, adminPath) : Promise.resolve(null),
    ])
      .then(([publishResponse, postResponse]) => {
        if (!active) return
        setPublishState(publishResponse.publish)
        if (postResponse) {
          setFormState(fromPost(postResponse.post))
          setResolvedPath(postResponse.post.adminPath)
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
        const payload = toPayload(formState)
        const response = resolvedPath
          ? await updatePost(adminKey, resolvedPath, payload)
          : await createPost(adminKey, payload)

        setFormState(fromPost(response.post))
        setResolvedPath(response.post.adminPath)
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

  return (
    <AdminShell
      title={pageTitle}
      description="文章会保存到 data/blog/YYYY/slug.mdx，图片会保存到 public/static/images/posts/YYYY/MM/slug/。"
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/posts" className="ledger-chip rounded-full px-4 py-2 text-sm">
          返回列表
        </Link>
        {resolvedPath ? (
          <span className="ledger-chip rounded-full px-4 py-2 text-sm">
            当前路径：{resolvedPath}
          </span>
        ) : null}
      </div>

      <PublishBanner state={publishState} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border p-6">
          {loading ? <p className="text-ledger-text-soft text-sm">正在加载文章...</p> : null}
          {!loading ? (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                savePost(false)
              }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="标题">
                  <input
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        title: event.target.value,
                      }))
                    }
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
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
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Slug（仅新建时生效）">
                  <input
                    value={formState.slug}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        slug: event.target.value,
                      }))
                    }
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                    placeholder="留空则按标题生成"
                    disabled={Boolean(resolvedPath)}
                  />
                </Field>
                <Field label="布局">
                  <input
                    value={formState.layout}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        layout: event.target.value,
                      }))
                    }
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                  />
                </Field>
              </div>

              <Field label="摘要">
                <textarea
                  value={formState.summary}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      summary: event.target.value,
                    }))
                  }
                  rows={3}
                  className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="标签（逗号分隔）">
                  <input
                    value={formState.tags}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        tags: event.target.value,
                      }))
                    }
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                  />
                </Field>
                <Field label="作者（逗号分隔）">
                  <input
                    value={formState.authors}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        authors: event.target.value,
                      }))
                    }
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="参考文献文件">
                  <input
                    value={formState.bibliography}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        bibliography: event.target.value,
                      }))
                    }
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                  />
                </Field>
                <Field label="Canonical URL">
                  <input
                    value={formState.canonicalUrl}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        canonicalUrl: event.target.value,
                      }))
                    }
                    className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                  />
                </Field>
              </div>

              <Field label="封面 / 图片路径（每行一条）">
                <textarea
                  value={formState.images}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      images: event.target.value,
                    }))
                  }
                  rows={4}
                  className="border-ledger-border w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
                />
              </Field>

              <Field label="正文（MDX）">
                <textarea
                  value={formState.body}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      body: event.target.value,
                    }))
                  }
                  rows={22}
                  className="border-ledger-border w-full rounded-[1.5rem] border bg-slate-950 px-4 py-4 font-mono text-sm text-slate-100"
                />
              </Field>

              <label className="text-ledger-text flex items-center gap-3 text-sm">
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

              {error ? <p className="text-ledger-danger text-sm">{error}</p> : null}
              {info ? <p className="text-ledger-success text-sm">{info}</p> : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-ledger-accent rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isPending ? '保存中...' : '保存草稿'}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => savePost(true)}
                  className="border-ledger-border-strong text-ledger-text rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  保存并发布
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border p-5">
            <h2 className="text-ledger-text text-lg font-semibold">图片上传</h2>
            <p className="text-ledger-text-soft mt-2 text-sm leading-7">
              图片会自动保存到文章对应目录，上传后会返回可直接粘贴到正文中的 Markdown。
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleUpload(event.target.files?.[0] || null)}
              className="text-ledger-text-soft file:bg-ledger-accent-soft file:text-ledger-text mt-4 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2"
            />
            {assetSnippet ? (
              <textarea
                readOnly
                value={assetSnippet}
                rows={4}
                className="border-ledger-border mt-4 w-full rounded-2xl border bg-white/80 px-4 py-3 font-mono text-sm dark:bg-slate-950/60"
              />
            ) : null}
          </div>

          <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border p-5">
            <h2 className="text-ledger-text text-lg font-semibold">目录规范</h2>
            <ul className="text-ledger-text-soft mt-3 space-y-2 text-sm leading-7">
              <li>文章：`data/blog/YYYY/slug.mdx`</li>
              <li>图片：`public/static/images/posts/YYYY/MM/slug/*`</li>
              <li>标签与作者字段支持逗号分隔录入</li>
            </ul>
          </div>
        </aside>
      </div>
    </AdminShell>
  )
}
