import { allAbouts } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'
import { components } from '@/components/MDXComponents'

export const metadata = genPageMetadata({ title: 'About' })

export default function AboutPage() {
  const about = allAbouts.find((item) => item.privacy === 'public') ?? allAbouts[0]

  if (!about) {
    return (
      <div className="ledger-surface p-6">
        <h1 className="ledger-heading text-3xl font-extrabold">About</h1>
        <p className="text-ledger-muted mt-2 text-sm">暂无可展示的项目说明。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="ledger-surface p-5 md:p-6">
        <p className="ledger-kicker">ProtoMe Blueprint</p>
        <h1 className="ledger-heading mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">
          {about.title}
        </h1>
        {about.summary && (
          <p className="text-ledger-text-soft mt-3 max-w-3xl text-base leading-7">
            {about.summary}
          </p>
        )}
        <p className="text-ledger-muted mt-2 text-xs">
          最近更新：{formatDate(about.updatedAt, siteMetadata.locale)}
        </p>
      </header>

      <article className="ledger-surface prose dark:prose-invert max-w-none p-5 md:p-6">
        <MDXLayoutRenderer code={about.body.code} components={components} />
      </article>
    </div>
  )
}
