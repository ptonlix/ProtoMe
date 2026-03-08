import { allProfiles } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'

export const metadata = genPageMetadata({ title: 'Profile' })

export default function ProfilePage() {
  const profile = allProfiles.find((item) => item.privacy === 'public') ?? allProfiles[0]

  if (!profile) {
    return (
      <div className="ledger-surface p-6">
        <h1 className="ledger-heading text-3xl font-extrabold">Profile</h1>
        <p className="text-ledger-muted mt-2 text-sm">暂无可展示资料。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="ledger-surface p-5 md:p-6">
        <p className="ledger-kicker">Personal Dossier</p>
        <h1 className="ledger-heading mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">
          {profile.name}
        </h1>
        <p className="text-ledger-text-soft mt-3 text-base leading-7">{profile.headline}</p>
        <p className="text-ledger-muted mt-2 text-xs">
          最近更新：{formatDate(profile.updatedAt, siteMetadata.locale)}
        </p>

        {profile.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="ledger-chip text-[0.65rem]">
                {skill}
              </span>
            ))}
          </div>
        )}
      </header>

      <section className="ledger-grid-columns gap-4">
        <article className="ledger-surface p-5 md:col-span-7">
          <h2 className="ledger-divider-title">核心亮点</h2>
          {profile.highlights.length > 0 ? (
            <ul className="text-ledger-text-soft mt-4 space-y-2 text-sm leading-7">
              {profile.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="bg-ledger-accent mt-2 h-1.5 w-1.5 rounded-full" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ledger-muted mt-4 text-sm">暂无核心亮点配置。</p>
          )}
        </article>

        <article className="ledger-surface p-5 md:col-span-5">
          <h2 className="ledger-divider-title">档案索引</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="border-ledger-border flex items-center justify-between gap-2 border-b pb-2">
              <dt className="text-ledger-muted">姓名</dt>
              <dd className="text-ledger-text font-medium">{profile.name}</dd>
            </div>
            {profile.location && (
              <div className="border-ledger-border flex items-center justify-between gap-2 border-b pb-2">
                <dt className="text-ledger-muted">位置</dt>
                <dd className="text-ledger-text font-medium">{profile.location}</dd>
              </div>
            )}
            {profile.website && (
              <div className="border-ledger-border flex items-center justify-between gap-2 border-b pb-2">
                <dt className="text-ledger-muted">网站</dt>
                <dd>
                  <Link href={profile.website} className="text-ledger-accent font-medium">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </Link>
                </dd>
              </div>
            )}
            {profile.email && (
              <div className="border-ledger-border flex items-center justify-between gap-2 border-b pb-2">
                <dt className="text-ledger-muted">邮箱</dt>
                <dd className="text-ledger-text font-medium">{profile.email}</dd>
              </div>
            )}
          </dl>
        </article>
      </section>

      <article className="ledger-surface prose dark:prose-invert max-w-none p-5 md:p-6">
        <MDXLayoutRenderer code={profile.body.code} />
      </article>
    </div>
  )
}
