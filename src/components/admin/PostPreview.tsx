'use client'

/* eslint-disable @next/next/no-img-element */

import { useDeferredValue } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkMath from 'remark-math'
import type { Components } from 'react-markdown'
import Pre from 'pliny/ui/Pre'
import CustomLink from '@/components/Link'
import TableWrapper from '@/components/TableWrapper'

const markdownComponents: Components = {
  a: ({ node: _node, ...props }) => <CustomLink {...props} href={props.href || '#'} />,
  img: ({ node: _node, alt, ...props }) => (
    // 后台预览使用原生 img，避免 Next/Image 对尺寸的强约束影响编辑体验。
    <img
      alt={alt || '文章配图'}
      className="w-full rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800"
      loading="lazy"
      {...props}
    />
  ),
  pre: ({ node: _node, children }) => <Pre>{children}</Pre>,
  table: ({ node: _node, children, ...props }) => (
    <TableWrapper>
      <table {...props}>{children}</table>
    </TableWrapper>
  ),
}

type PostPreviewProps = {
  title: string
  summary: string
  body: string
}

export default function PostPreview({ title, summary, body }: PostPreviewProps) {
  const deferredBody = useDeferredValue(body)
  const deferredSummary = useDeferredValue(summary)
  const isSyncing = deferredBody !== body || deferredSummary !== summary

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 border-b border-slate-100 pb-6 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-[0.28em] text-slate-400 uppercase">
              Preview
            </p>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {isSyncing ? '正在更新预览…' : '预览已同步'}
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {title || '未命名文章'}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            {summary || '这里会展示摘要区的内容，方便你检查列表页与 SEO 文案。'}
          </p>
        </div>

        {deferredBody.trim() ? (
          <article className="prose prose-slate dark:prose-invert prose-headings:scroll-mt-24 prose-pre:rounded-2xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-950 prose-img:rounded-2xl prose-img:shadow-sm prose-table:text-sm max-w-none">
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm, remarkMath, remarkAlert]}
              rehypePlugins={[
                rehypeKatex,
                [rehypePrismPlus, { defaultLanguage: 'md', ignoreMissing: true }],
              ]}
            >
              {deferredBody}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-sm leading-7 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            在左侧输入 Markdown 或 MDX 正文后，这里会实时显示更接近前台文章页的排版效果，
            包括标题、列表、引用、表格、数学公式和代码块。
          </div>
        )}
      </div>
    </div>
  )
}
