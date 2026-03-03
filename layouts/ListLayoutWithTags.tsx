'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  posts: Array<{
    path: string
    title: string
    date: string
  }>
}

function getCategoryFromPath(path: string) {
  const relativePath = path.replace(/^blog\//, '')
  const pathParts = relativePath.split('/').filter(Boolean)
  return pathParts.length > 1 ? pathParts[0] : 'other'
}

function getCategoryGroups(posts: CoreContent<Blog>[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup['posts']>()

  posts.forEach((post) => {
    const category = getCategoryFromPath(post.path)
    const groupPosts = groups.get(category) || []
    groupPosts.push({
      path: post.path,
      title: post.title,
      date: post.date,
    })
    groups.set(category, groupPosts)
  })

  return Array.from(groups.entries())
    .map(([category, groupPosts]) => ({
      category,
      posts: groupPosts.sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

function formatCategoryLabel(category: string) {
  if (category === 'other') return 'Other'
  if (/^[a-z]{2,3}$/i.test(category)) return category.toUpperCase()
  return category.replace(/[-_]/g, ' ')
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const basePath = pathname
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/page\/\d+\/?$/, '') // Remove any trailing /page
    .replace(/\/$/, '') // Remove trailing slash
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
          </Link>
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const isBlogRoute = pathname.startsWith('/blog')

  const tagCounts = tagData as Record<string, number>
  const sortedTags = isBlogRoute
    ? []
    : Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])
  const categoryGroups = isBlogRoute ? getCategoryGroups(posts) : []

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts
  const filteredDisplayPosts =
    isBlogRoute && selectedCategory
      ? posts.filter((post) => getCategoryFromPath(post.path) === selectedCategory)
      : displayPosts

  return (
    <>
      <div>
        <div className="pt-6 pb-6">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:hidden sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {title}
          </h1>
        </div>
        <div className="flex sm:space-x-24">
          <div className="hidden h-full max-h-screen max-w-[280px] min-w-[280px] flex-wrap overflow-auto rounded-sm bg-gray-50 pt-5 shadow-md sm:flex dark:bg-gray-900/70 dark:shadow-gray-800/40">
            <div className="px-6 py-4">
              {isBlogRoute ? (
                <>
                  <h3 className="text-primary-500 font-bold uppercase">By Category</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`mt-2 px-3 py-1 text-sm font-semibold uppercase ${
                      selectedCategory === null
                        ? 'text-primary-500'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                    }`}
                  >
                    All Posts
                  </button>
                  <ul className="mt-3">
                    {categoryGroups.map((group, index) => (
                      <li key={group.category} className="my-2">
                        <details open={index === 0}>
                          <summary
                            onClick={() => setSelectedCategory(group.category)}
                            className={`cursor-pointer list-none px-3 py-2 text-sm font-bold uppercase ${
                              selectedCategory === group.category
                                ? 'text-primary-500'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span className="hover:text-primary-500 dark:hover:text-primary-500 inline-flex items-center gap-1">
                              <span>{formatCategoryLabel(group.category)}</span>
                              <span className="text-xs font-medium">({group.posts.length})</span>
                            </span>
                          </summary>
                          <ul className="mt-1 space-y-1">
                            {group.posts.map((categoryPost) => {
                              const isActive = pathname === `/${categoryPost.path}`
                              return (
                                <li key={categoryPost.path}>
                                  <Link
                                    href={`/${categoryPost.path}`}
                                    className={`hover:text-primary-500 dark:hover:text-primary-500 block rounded px-3 py-1.5 text-sm ${
                                      isActive
                                        ? 'text-primary-500 font-semibold'
                                        : 'text-gray-500 dark:text-gray-300'
                                    }`}
                                  >
                                    {categoryPost.title}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <Link
                    href={`/blog`}
                    className="hover:text-primary-500 dark:hover:text-primary-500 font-bold text-gray-700 uppercase dark:text-gray-300"
                  >
                    All Posts
                  </Link>
                  <ul>
                    {sortedTags.map((t) => {
                      return (
                        <li key={t} className="my-3">
                          {decodeURI(pathname.split('/tags/')[1]) === slug(t) ? (
                            <h3 className="text-primary-500 inline px-3 py-2 text-sm font-bold uppercase">
                              {`${t} (${tagCounts[t]})`}
                            </h3>
                          ) : (
                            <Link
                              href={`/tags/${slug(t)}`}
                              className="hover:text-primary-500 dark:hover:text-primary-500 px-3 py-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-300"
                              aria-label={`View posts tagged ${t}`}
                            >
                              {`${t} (${tagCounts[t]})`}
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
          <div>
            <ul>
              {filteredDisplayPosts.map((post) => {
                const { path, date, title, summary, tags } = post
                return (
                  <li key={path} className="py-5">
                    <article className="flex flex-col space-y-2 xl:space-y-0">
                      <dl>
                        <dt className="sr-only">Published on</dt>
                        <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                          <time dateTime={date} suppressHydrationWarning>
                            {formatDate(date, siteMetadata.locale)}
                          </time>
                        </dd>
                      </dl>
                      <div className="space-y-3">
                        <div>
                          <h2 className="text-2xl leading-8 font-bold tracking-tight">
                            <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags?.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
            {pagination && pagination.totalPages > 1 && !(isBlogRoute && selectedCategory) && (
              <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
