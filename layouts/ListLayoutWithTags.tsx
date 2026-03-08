'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'

interface PaginationProps {
  totalPages: number
  currentPage: number
}

interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

interface CategoryGroup {
  category: string
  postCount: number
}

function getCategoryFromPath(path: string) {
  const relativePath = path.replace(/^blog\//, '')
  const pathParts = relativePath.split('/').filter(Boolean)
  return pathParts.length > 1 ? pathParts[0] : 'other'
}

function formatCategoryLabel(category: string) {
  if (category === 'other') return 'Other'
  if (/^[a-z]{2,3}$/i.test(category)) return category.toUpperCase()
  return category.replace(/[-_]/g, ' ')
}

function getCategoryGroups(posts: CoreContent<Blog>[]): CategoryGroup[] {
  const map = new Map<string, number>()
  posts.forEach((post) => {
    const category = getCategoryFromPath(post.path)
    map.set(category, (map.get(category) || 0) + 1)
  })

  return Array.from(map.entries())
    .map(([category, postCount]) => ({ category, postCount }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname
    .replace(/^\//, '')
    .replace(/\/page\/\d+\/?$/, '')
    .replace(/\/$/, '')

  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="pt-5 pb-3">
      <nav className="flex items-center justify-between gap-2" aria-label="分页导航">
        {prevPage ? (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
            className="ledger-btn ledger-btn-secondary text-xs"
          >
            上一页
          </Link>
        ) : (
          <button
            className="ledger-btn ledger-btn-secondary cursor-not-allowed opacity-50"
            disabled
          >
            上一页
          </button>
        )}

        <span className="text-ledger-muted font-mono text-xs tracking-[0.1em] uppercase">
          {currentPage} / {totalPages}
        </span>

        {nextPage ? (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="ledger-btn ledger-btn-secondary text-xs"
          >
            下一页
          </Link>
        ) : (
          <button
            className="ledger-btn ledger-btn-secondary cursor-not-allowed opacity-50"
            disabled
          >
            下一页
          </button>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTagSlug, setSelectedTagSlug] = useState<string | null>(null)
  const [tagSearchKeyword, setTagSearchKeyword] = useState('')
  const isBlogRoute = pathname.startsWith('/blog')

  const tagCounts = tagData as Record<string, number>
  const sortedTags = useMemo(
    () => Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]),
    [tagCounts]
  )
  const categoryGroups = useMemo(
    () => (isBlogRoute ? getCategoryGroups(posts) : []),
    [isBlogRoute, posts]
  )

  useEffect(() => {
    if (!isBlogRoute) {
      return
    }

    const tagFromQuery = searchParams.get('tag')
    setSelectedTagSlug(tagFromQuery ? slug(tagFromQuery) : null)
  }, [isBlogRoute, searchParams])

  const normalizedTagSearchKeyword = tagSearchKeyword.trim().toLowerCase()
  const filteredTags = normalizedTagSearchKeyword
    ? sortedTags.filter((tag) => tag.toLowerCase().includes(normalizedTagSearchKeyword))
    : sortedTags

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts
  const hasActiveFilters = isBlogRoute && (selectedCategory !== null || selectedTagSlug !== null)

  const filteredDisplayPosts =
    isBlogRoute && hasActiveFilters
      ? posts.filter((post) => {
          const categoryMatched =
            selectedCategory === null || getCategoryFromPath(post.path) === selectedCategory
          const tagMatched =
            selectedTagSlug === null || post.tags?.some((item) => slug(item) === selectedTagSlug)
          return categoryMatched && Boolean(tagMatched)
        })
      : displayPosts

  return (
    <div className="space-y-5">
      <header className="ledger-surface p-5 md:p-6">
        <p className="ledger-kicker">Knowledge Index</p>
        <h1 className="ledger-heading mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="text-ledger-text-soft mt-3 max-w-3xl text-sm leading-7">
          索引优先展示标题、时间、标签与分类结构，便于快速扫描和定位。
        </p>
      </header>

      <div className="ledger-grid-columns items-start gap-5">
        <aside className="hidden space-y-4 md:col-span-4 md:block lg:col-span-3">
          {isBlogRoute ? (
            <>
              <section className="ledger-surface sticky top-24 p-4">
                <p className="ledger-kicker">Category</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    data-active={selectedCategory === null ? 'true' : 'false'}
                    className="ledger-chip"
                  >
                    All ({posts.length})
                  </button>
                  {categoryGroups.map((group) => (
                    <button
                      key={group.category}
                      type="button"
                      onClick={() =>
                        setSelectedCategory((current) =>
                          current === group.category ? null : group.category
                        )
                      }
                      data-active={selectedCategory === group.category ? 'true' : 'false'}
                      className="ledger-chip"
                    >
                      {formatCategoryLabel(group.category)} ({group.postCount})
                    </button>
                  ))}
                </div>
              </section>

              <section className="ledger-surface p-4">
                <p className="ledger-kicker">Tags</p>
                <label htmlFor="tag-search-input" className="sr-only">
                  搜索标签
                </label>
                <input
                  id="tag-search-input"
                  type="text"
                  value={tagSearchKeyword}
                  onChange={(event) => setTagSearchKeyword(event.target.value)}
                  placeholder="搜索标签"
                  className="border-ledger-border bg-ledger-panel-muted text-ledger-text placeholder:text-ledger-muted mt-3 w-full rounded-lg border px-3 py-2 text-sm"
                />
                <div className="no-scrollbar mt-3 max-h-[17.5rem] space-y-2 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTagSlug(null)}
                    data-active={selectedTagSlug === null ? 'true' : 'false'}
                    className="ledger-chip"
                  >
                    All Tags
                  </button>
                  {filteredTags.map((tag) => {
                    const tagSlug = slug(tag)
                    const isActiveTag = selectedTagSlug === tagSlug
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setSelectedTagSlug((current) => (current === tagSlug ? null : tagSlug))
                        }
                        data-active={isActiveTag ? 'true' : 'false'}
                        className="ledger-chip"
                        aria-label={`按标签 ${tag} 过滤`}
                      >
                        {tag} ({tagCounts[tag]})
                      </button>
                    )
                  })}
                  {filteredTags.length === 0 && (
                    <p className="text-ledger-muted text-sm">无匹配标签</p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="ledger-surface p-4">
              <p className="ledger-kicker">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sortedTags.map((tag) => {
                  const tagSlug = slug(tag)
                  const isActive = selectedTagSlug === tagSlug

                  return (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tagSlug)}`}
                      data-active={isActive ? 'true' : 'false'}
                      className="ledger-chip"
                    >
                      {tag} ({tagCounts[tag]})
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </aside>

        <section className="space-y-3 md:col-span-8 lg:col-span-9">
          {filteredDisplayPosts.length === 0 && (
            <div className="ledger-surface text-ledger-muted p-8 text-sm">
              没有匹配的文章，请调整筛选条件。
            </div>
          )}

          <ul className="space-y-3">
            {filteredDisplayPosts.map((post) => {
              const { path, date, title: postTitle, summary, tags } = post

              return (
                <li key={path}>
                  <article className="ledger-surface p-4 md:p-5">
                    <div className="text-ledger-muted flex flex-wrap items-center gap-3 text-xs">
                      <time dateTime={date} suppressHydrationWarning>
                        {formatDate(date, siteMetadata.locale)}
                      </time>
                      <span className="font-mono tracking-[0.08em] uppercase">
                        {getCategoryFromPath(path)}
                      </span>
                    </div>

                    <h2 className="ledger-heading mt-2 text-2xl font-bold md:text-3xl">
                      <Link href={`/${path}`} className="text-ledger-text hover:text-ledger-accent">
                        {postTitle}
                      </Link>
                    </h2>

                    <div className="mt-3 flex flex-wrap">
                      {tags?.map((tag) => (
                        <Tag key={tag} text={tag} />
                      ))}
                    </div>

                    {summary && (
                      <p className="text-ledger-text-soft mt-2 text-sm leading-7">{summary}</p>
                    )}
                  </article>
                </li>
              )
            })}
          </ul>

          {pagination && pagination.totalPages > 1 && !hasActiveFilters && (
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
          )}
        </section>
      </div>
    </div>
  )
}
