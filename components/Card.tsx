import Image from './Image'
import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'

type ProjectStatus = 'idea' | 'active' | 'paused' | 'completed' | 'archived'

interface CardProps {
  title: string
  description: string
  imgSrc?: string
  href?: string
  status?: ProjectStatus | string
  role?: string
  updatedAt?: string
  stack?: string[]
  repo?: string
  demo?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  idea: { label: '构思中', className: 'ledger-status ledger-status-idea' },
  active: { label: '进行中', className: 'ledger-status ledger-status-active' },
  paused: { label: '暂停', className: 'ledger-status ledger-status-paused' },
  completed: { label: '完成', className: 'ledger-status ledger-status-completed' },
  archived: { label: '归档', className: 'ledger-status ledger-status-archived' },
}

const Card = ({
  title,
  description,
  imgSrc,
  href,
  status,
  role,
  updatedAt,
  stack,
  repo,
  demo,
}: CardProps) => {
  const primaryLink = href || demo || repo
  const actionLinks = [
    demo ? { label: 'Demo', href: demo } : null,
    repo ? { label: 'Repo', href: repo } : null,
    primaryLink && primaryLink !== demo && primaryLink !== repo
      ? { label: '详情', href: primaryLink }
      : null,
  ].filter((item): item is { label: string; href: string } => Boolean(item))

  const statusMeta = status ? statusConfig[status] : null

  return (
    <article className="ledger-surface flex h-full flex-col overflow-hidden p-5">
      {imgSrc &&
        (primaryLink ? (
          <Link
            href={primaryLink}
            aria-label={`Link to ${title}`}
            className="mb-4 block overflow-hidden rounded-lg"
          >
            <Image
              alt={title}
              src={imgSrc}
              className="h-44 w-full object-cover object-center"
              width={544}
              height={306}
            />
          </Link>
        ) : (
          <div className="mb-4 overflow-hidden rounded-lg">
            <Image
              alt={title}
              src={imgSrc}
              className="h-44 w-full object-cover object-center"
              width={544}
              height={306}
            />
          </div>
        ))}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {status && (
          <span className={statusMeta?.className ?? 'ledger-status ledger-status-archived'}>
            {statusMeta?.label ?? status}
          </span>
        )}
        {role && <span className="ledger-chip text-[0.65rem]">角色 {role}</span>}
        {updatedAt && (
          <span className="text-ledger-muted text-xs">
            更新 {formatDate(updatedAt, siteMetadata.locale)}
          </span>
        )}
      </div>

      <h3 className="ledger-heading text-2xl font-bold">
        {primaryLink ? (
          <Link
            href={primaryLink}
            aria-label={`Link to ${title}`}
            className="text-ledger-text hover:text-ledger-accent"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>

      <p className="text-ledger-text-soft mt-3 text-sm leading-6">{description}</p>

      {stack && stack.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stack.slice(0, 8).map((tech) => (
            <span
              key={`${title}-${tech}`}
              className="ledger-chip text-[0.64rem]"
              data-active="false"
            >
              {tech}
            </span>
          ))}
          {stack.length > 8 && (
            <span className="ledger-chip text-[0.64rem]">+{stack.length - 8}</span>
          )}
        </div>
      )}

      {actionLinks.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {actionLinks.map((link, index) => (
            <Link
              key={`${title}-${link.label}-${link.href}`}
              href={link.href}
              className={`ledger-btn ${index === 0 ? 'ledger-btn-primary' : 'ledger-btn-secondary'} text-xs`}
              aria-label={`${link.label}: ${title}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}

export default Card
