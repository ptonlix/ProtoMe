import { allProfiles } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'
import Link from '@/components/Link'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'

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
      <header className="ledger-surface px-5 py-7 md:px-8 md:py-9">
        <p className="ledger-kicker text-center md:text-left">Personal Dossier</p>
        <div className="mx-auto mt-4 grid max-w-5xl items-center gap-5 md:grid-cols-[120px_minmax(0,1fr)] md:gap-7">
          <div className="mx-auto md:mx-0">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={`${profile.name} avatar`}
                width={120}
                height={120}
                className="border-ledger-border h-24 w-24 rounded-2xl border object-cover shadow-sm md:h-[7.5rem] md:w-[7.5rem]"
              />
            ) : (
              <div className="bg-ledger-panel-muted text-ledger-text border-ledger-border flex h-24 w-24 items-center justify-center rounded-2xl border text-2xl font-bold md:h-[7.5rem] md:w-[7.5rem]">
                {profile.name.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="text-center md:text-left">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-start md:gap-6">
              <div>
                <h1 className="ledger-heading text-4xl font-extrabold sm:text-5xl md:text-6xl">
                  {profile.name}
                </h1>
                <p className="text-ledger-text-soft mt-2 text-base leading-7">{profile.headline}</p>
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

                {profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 md:justify-start">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="ledger-chip border-sky-300/75 bg-sky-100/55 px-2 py-0.5 text-[0.66rem] text-sky-900"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:pt-1">
                <p className="ledger-kicker text-center md:text-left">核心亮点</p>
                {profile.highlights.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
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
                  <p className="text-ledger-muted mt-2 text-center text-sm md:text-left">
                    暂无核心亮点配置。
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-ledger-border mx-auto mt-7 max-w-5xl border-t pt-4">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-between">
            {profile.website && (
              <Link href={profile.website} className="text-ledger-accent text-sm font-medium">
                {profile.website.replace(/^https?:\/\//, '')}
              </Link>
            )}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {socialLinks.map((item) => (
                  <span key={item.kind} className="ledger-chip px-2 py-1">
                    <SocialIcon kind={item.kind} href={item.href} size={4} />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <article className="ledger-surface prose dark:prose-invert max-w-none p-5 md:p-6">
        <MDXLayoutRenderer code={profile.body.code} />
      </article>
    </div>
  )
}
