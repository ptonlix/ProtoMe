import Link from 'next/link'

export default function AdminShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-ledger-text-soft text-xs font-semibold tracking-[0.3em] uppercase">
              Admin Console
            </p>
            <h1 className="text-ledger-text mt-2 text-3xl font-semibold">{title}</h1>
            <p className="text-ledger-text-soft mt-2 max-w-2xl text-sm leading-7">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/posts" className="ledger-chip rounded-full px-4 py-2">
              文章列表
            </Link>
            <Link href="/admin/posts/new" className="ledger-chip rounded-full px-4 py-2">
              新建文章
            </Link>
            <Link href="/blog" className="ledger-chip rounded-full px-4 py-2">
              查看前台
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
