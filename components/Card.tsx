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

const statusConfig: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  idea: {
    label: '想法',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  },
  active: {
    label: '进行中',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  paused: {
    label: '暂停',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  completed: {
    label: '已完成',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  archived: {
    label: '归档',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
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
    <div className="md max-w-[544px] p-4 md:w-1/2">
      <div className="h-full overflow-hidden rounded-md border-2 border-gray-200/60 dark:border-gray-700/60">
        {imgSrc &&
          (primaryLink ? (
            <Link href={primaryLink} aria-label={`Link to ${title}`}>
              <Image
                alt={title}
                src={imgSrc}
                className="object-cover object-center md:h-36 lg:h-48"
                width={544}
                height={306}
              />
            </Link>
          ) : (
            <Image
              alt={title}
              src={imgSrc}
              className="object-cover object-center md:h-36 lg:h-48"
              width={544}
              height={306}
            />
          ))}
        <div className="flex h-full flex-col p-6">
          <h2 className="mb-3 text-2xl leading-8 font-bold tracking-tight">
            {primaryLink ? (
              <Link href={primaryLink} aria-label={`Link to ${title}`}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {status && (
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium ${statusMeta?.className ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
              >
                {statusMeta?.label ?? status}
              </span>
            )}
            {role && <span className="text-xs text-gray-500 dark:text-gray-400">角色：{role}</span>}
            {updatedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                更新：{formatDate(updatedAt, siteMetadata.locale)}
              </span>
            )}
          </div>
          <p className="prose mb-4 max-w-none text-gray-500 dark:text-gray-400">{description}</p>
          {stack && stack.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {stack.slice(0, 6).map((tech) => (
                <span
                  key={`${title}-${tech}`}
                  className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {tech}
                </span>
              ))}
              {stack.length > 6 && (
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  +{stack.length - 6}
                </span>
              )}
            </div>
          )}
          {actionLinks.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-4 text-sm leading-6 font-medium">
              {actionLinks.map((link) => (
                <Link
                  key={`${title}-${link.label}-${link.href}`}
                  href={link.href}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                  aria-label={`${link.label}: ${title}`}
                >
                  {link.label} &rarr;
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Card
