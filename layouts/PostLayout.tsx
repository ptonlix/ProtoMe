import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'

const editUrl = (path: string) => `${siteMetadata.siteRepo}/blob/main/data/${path}`
const discussUrl = (path: string) =>
  `https://mobile.twitter.com/search?q=${encodeURIComponent(`${siteMetadata.siteUrl}/${path}`)}`

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
}

export default function PostLayout({ content, authorDetails, next, prev, children }: LayoutProps) {
  const { filePath, path, slug, date, title, tags } = content
  const basePath = path.split('/')[0]

  return (
    <>
      <ScrollTopAndComment />
      <article className="space-y-6">
        <header className="ledger-surface p-5 text-center md:p-7">
          <p className="ledger-kicker">Reading Mode</p>
          <time className="text-ledger-muted mt-2 block text-sm" dateTime={date}>
            {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
          </time>
          <div className="mt-3">
            <PageTitle>{title}</PageTitle>
          </div>
        </header>

        <div className="ledger-grid-columns items-start gap-5">
          <aside className="space-y-4 md:col-span-4 lg:col-span-3">
            <section className="ledger-surface p-4">
              <p className="ledger-kicker">Authors</p>
              <ul className="mt-3 space-y-3">
                {authorDetails.map((author) => (
                  <li className="flex items-center gap-3" key={author.name}>
                    {author.avatar && (
                      <Image
                        src={author.avatar}
                        width={40}
                        height={40}
                        alt="avatar"
                        className="border-ledger-border h-10 w-10 rounded-xl border"
                      />
                    )}
                    <div>
                      <p className="text-ledger-text text-sm font-semibold">{author.name}</p>
                      {author.twitter && (
                        <Link href={author.twitter} className="text-ledger-accent text-xs">
                          {author.twitter
                            .replace('https://twitter.com/', '@')
                            .replace('https://x.com/', '@')}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {tags && tags.length > 0 && (
              <section className="ledger-surface p-4">
                <p className="ledger-kicker">Tags</p>
                <div className="mt-3 flex flex-wrap">
                  {tags.map((tag) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
              </section>
            )}

            {(next || prev) && (
              <section className="ledger-surface p-4">
                <p className="ledger-kicker">Neighbor Articles</p>
                <div className="mt-3 space-y-3 text-sm">
                  {prev && prev.path && (
                    <div>
                      <p className="text-ledger-muted text-xs">Previous</p>
                      <Link
                        href={`/${prev.path}`}
                        className="text-ledger-text hover:text-ledger-accent"
                      >
                        {prev.title}
                      </Link>
                    </div>
                  )}
                  {next && next.path && (
                    <div>
                      <p className="text-ledger-muted text-xs">Next</p>
                      <Link
                        href={`/${next.path}`}
                        className="text-ledger-text hover:text-ledger-accent"
                      >
                        {next.title}
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}
          </aside>

          <div className="space-y-4 md:col-span-8 lg:col-span-9">
            <section className="ledger-surface p-5 md:p-7">
              <div className="prose dark:prose-invert max-w-none">{children}</div>
            </section>

            <section className="ledger-surface text-ledger-text-soft flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={discussUrl(path)}
                  rel="nofollow"
                  className="ledger-btn ledger-btn-ghost text-xs"
                >
                  Discuss on X
                </Link>
                <Link href={editUrl(filePath)} className="ledger-btn ledger-btn-ghost text-xs">
                  View on GitHub
                </Link>
              </div>
              <Link
                href={`/${basePath}`}
                className="ledger-btn ledger-btn-secondary text-xs"
                aria-label="Back to the blog"
              >
                返回 Blog
              </Link>
            </section>

            {siteMetadata.comments && (
              <section className="ledger-surface text-ledger-text-soft p-4" id="comment">
                <Comments slug={slug} />
              </section>
            )}
          </div>
        </div>
      </article>
    </>
  )
}
