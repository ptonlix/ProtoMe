import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

const socialKinds = [
  'mail',
  'github',
  'linkedin',
  'x',
  'bluesky',
  'instagram',
  'threads',
  'youtube',
] as const

const socialMap: Record<(typeof socialKinds)[number], string | undefined> = {
  mail: siteMetadata.email ? `mailto:${siteMetadata.email}` : undefined,
  github: siteMetadata.github,
  linkedin: siteMetadata.linkedin,
  x: siteMetadata.x,
  bluesky: siteMetadata.bluesky,
  instagram: siteMetadata.instagram,
  threads: siteMetadata.threads,
  youtube: siteMetadata.youtube,
}

export default function Footer() {
  const version = process.env.npm_package_version
    ? `v${process.env.npm_package_version}`
    : 'v-local'
  const socialLinks = socialKinds.filter((kind) => Boolean(socialMap[kind]))

  return (
    <footer className="mt-10 pb-8">
      <div className="ledger-surface px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="ledger-kicker">System Tailnote</p>
            <p className="text-ledger-text-soft mt-1 text-sm">
              {siteMetadata.author} · © {new Date().getFullYear()} · {siteMetadata.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {socialLinks.map((kind) => (
              <span key={kind} className="ledger-chip px-2 py-1">
                <SocialIcon kind={kind} href={socialMap[kind]} size={4} />
              </span>
            ))}
          </div>
        </div>

        <div className="border-ledger-border text-ledger-muted mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
          <p className="font-mono tracking-[0.08em] uppercase">Runtime {version}</p>
          <Link
            href="https://github.com/timlrx/tailwind-nextjs-starter-blog"
            className="ledger-btn ledger-btn-ghost px-2 py-1 text-xs"
          >
            基于 Tailwind Nextjs Theme
          </Link>
        </div>
      </div>
    </footer>
  )
}
