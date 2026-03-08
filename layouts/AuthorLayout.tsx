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

  return (
    <div className="space-y-6">
      <header className="ledger-surface p-5 md:p-6">
        <p className="ledger-kicker">Methodology Archive</p>
        <h1 className="ledger-heading mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">
          About
        </h1>
        <p className="text-ledger-text-soft mt-3 max-w-3xl text-sm leading-7">
          记录长期方法论、协作习惯与技术实践，作为个人工程系统说明书。
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

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="ledger-chip px-2 py-1">
                <SocialIcon kind="mail" href={email ? `mailto:${email}` : undefined} size={4} />
              </span>
              <span className="ledger-chip px-2 py-1">
                <SocialIcon kind="github" href={github} size={4} />
              </span>
              <span className="ledger-chip px-2 py-1">
                <SocialIcon kind="linkedin" href={linkedin} size={4} />
              </span>
              <span className="ledger-chip px-2 py-1">
                <SocialIcon kind="x" href={twitter} size={4} />
              </span>
              <span className="ledger-chip px-2 py-1">
                <SocialIcon kind="bluesky" href={bluesky} size={4} />
              </span>
            </div>
          </div>
        </aside>

        <article className="ledger-surface prose dark:prose-invert max-w-none p-5 md:col-span-8 md:p-6">
          {children}
        </article>
      </section>
    </div>
  )
}
