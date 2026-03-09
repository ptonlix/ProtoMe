import { ReactNode } from 'react'
import type { Authors } from 'contentlayer/generated'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'

interface Props {
  children: ReactNode
  content: Omit<Authors, '_id' | '_raw' | 'body'>
}

export default function AuthorLayout({ children, content }: Props) {
  const { name, avatar, occupation, company, email, twitter, bluesky, linkedin, github } = content
  const socialLinks = [
    { kind: 'mail', href: email ? `mailto:${email}` : undefined },
    { kind: 'github', href: github },
    { kind: 'linkedin', href: linkedin },
    { kind: 'x', href: twitter },
    { kind: 'bluesky', href: bluesky },
  ].filter((item) => Boolean(item.href))

  return (
    <div className="space-y-6">
      <header className="ledger-surface p-5 md:p-6">
        <p className="ledger-kicker">Personal Profile</p>
        <h1 className="ledger-heading mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">
          About
        </h1>
        <p className="text-ledger-text-soft mt-3 max-w-3xl text-sm leading-7">
          记录个人长期方法论、协作习惯与技术实践
        </p>
      </header>

      <section className="ledger-grid-columns gap-4">
        <aside className="ledger-surface p-5 md:col-span-4">
          <div className="flex flex-col items-center text-center">
            {avatar && (
              <Image
                src={avatar}
                alt="avatar"
                width={192}
                height={192}
                className="border-ledger-border h-32 w-32 rounded-2xl border object-cover"
              />
            )}
            <h2 className="ledger-heading mt-4 text-2xl font-bold">{name}</h2>
            <p className="text-ledger-text-soft mt-1 text-sm">{occupation}</p>
            <p className="text-ledger-muted text-sm">{company}</p>

            {socialLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {socialLinks.map((item) => (
                  <span key={item.kind} className="ledger-chip px-2 py-1">
                    <SocialIcon kind={item.kind} href={item.href} size={4} />
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>

        <article className="ledger-surface prose dark:prose-invert max-w-none p-5 md:col-span-8 md:p-6">
          {children}
        </article>
      </section>
    </div>
  )
}
