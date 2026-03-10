import { allProfiles } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'
import SocialIcon from '@/components/social-icons'

export const metadata = genPageMetadata({ title: 'Profile' })

type HighlightIconKind = 'brain' | 'database' | 'spark'
type ContactIconLink = { kind: 'mail' | 'github' | 'linkedin' | 'x'; href: string }

function resolveHighlightIconKind(text: string, index: number): HighlightIconKind {
  if (/(知识|knowledge|认知)/i.test(text)) return 'brain'
  if (/(memory|记忆|存储|仓库)/i.test(text)) return 'database'
  if (/(读懂|理解|智能|agent|自动化)/i.test(text)) return 'spark'
  return (['brain', 'database', 'spark'][index % 3] as HighlightIconKind) ?? 'spark'
}

function HighlightIcon({ kind }: { kind: HighlightIconKind }) {
  if (kind === 'brain') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M9.5 6a2.5 2.5 0 0 0-2.5 2.5v.3A3.2 3.2 0 0 0 5 12a3.5 3.5 0 0 0 2.2 3.2" />
        <path d="M14.5 6A2.5 2.5 0 0 1 17 8.5v.3A3.2 3.2 0 0 1 19 12a3.5 3.5 0 0 1-2.2 3.2" />
        <path d="M9 10.5h6M9.2 14h5.6M12 6v11.5" />
      </svg>
    )
  }

  if (kind === 'database') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <ellipse cx="12" cy="5.5" rx="6.5" ry="3" />
        <path d="M5.5 5.5v6.1c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3V5.5" />
        <path d="M5.5 8.6c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3" />
        <path d="M5.5 11.7c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m12 3 2.3 6.2L21 12l-6.7 2.8L12 21l-2.3-6.2L3 12l6.7-2.8z" />
    </svg>
  )
}

export default function ProfilePage() {
  const profile = allProfiles.find((item) => item.privacy === 'public') ?? allProfiles[0]
  const mailHref = profile?.email ? `mailto:${profile.email}` : undefined
  const socialLinks = [
    { kind: 'mail', href: mailHref },
    { kind: 'github', href: profile?.github },
    { kind: 'linkedin', href: profile?.linkedin },
    { kind: 'x', href: profile?.twitter },
  ].filter((item): item is ContactIconLink => Boolean(item.href))

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
      <header className="ledger-surface px-5 py-8 md:px-8 md:py-10">
        <p className="ledger-kicker text-center">Personal Dossier</p>
        <div className="mx-auto mt-3 max-w-4xl text-center">
          <h1 className="ledger-heading text-4xl font-extrabold sm:text-5xl md:text-6xl">
            {profile.name}
          </h1>
          <p className="text-ledger-text-soft mt-3 text-base leading-7">{profile.headline}</p>
          {(profile.company || profile.location) && (
            <p className="text-ledger-muted mt-2 text-sm">
              {profile.company}
              {profile.company && profile.location ? ' · ' : ''}
              {profile.location}
            </p>
          )}
          <p className="text-ledger-muted mt-2 text-xs">
            最近更新：{formatDate(profile.updatedAt, siteMetadata.locale)}
          </p>
        </div>

        {profile.skills.length > 0 && (
          <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-1.5 rounded-xl border border-sky-200/70 bg-sky-100/45 px-3 py-2.5">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-sky-300/70 bg-white/70 px-2 py-0.5 text-[0.66rem] font-medium tracking-wide text-sky-900"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mx-auto mt-5 max-w-4xl">
          <p className="ledger-kicker text-center">核心亮点</p>
          {profile.highlights.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {profile.highlights.map((highlight, index) => (
                <div
                  key={highlight}
                  className="border-ledger-border bg-ledger-panel-muted/45 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                >
                  <span className="text-ledger-accent inline-flex h-4 w-4 items-center justify-center">
                    <HighlightIcon kind={resolveHighlightIconKind(highlight, index)} />
                  </span>
                  <p className="text-ledger-text leading-5">{highlight}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ledger-muted mt-3 text-center text-sm">暂无核心亮点配置。</p>
          )}
        </div>

        <div className="border-ledger-border mx-auto mt-8 max-w-3xl border-t pt-4">
          <div className="text-ledger-muted flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            {profile.website && (
              <Link href={profile.website} className="text-ledger-accent font-medium">
                {profile.website.replace(/^https?:\/\//, '')}
              </Link>
            )}
          </div>

          {socialLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {socialLinks.map((item) => (
                <span key={item.kind} className="ledger-chip px-2 py-1">
                  <SocialIcon kind={item.kind} href={item.href} size={4} />
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <article className="ledger-surface prose dark:prose-invert max-w-none p-5 md:p-6">
        <MDXLayoutRenderer code={profile.body.code} />
      </article>
    </div>
  )
}
