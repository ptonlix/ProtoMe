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
      <div className="ledger-panel border-ledger-border shadow-ledger-sm rounded-[2rem] border px-6 py-6 md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-ledger-text-soft text-[11px] font-semibold tracking-[0.35em] uppercase">
                Admin Console
              </span>
              <span className="border-ledger-border text-ledger-text-soft rounded-full border bg-white/60 px-3 py-1 text-xs dark:bg-slate-950/50">
                Editorial Workspace
              </span>
            </div>
            <div>
              <h1 className="text-ledger-text text-3xl font-semibold md:text-4xl">{title}</h1>
              <p className="text-ledger-text-soft mt-3 max-w-3xl text-sm leading-7">
                {description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/posts"
              className="border-ledger-border text-ledger-text hover:bg-ledger-accent-soft/40 rounded-[1.5rem] border bg-white/70 px-4 py-3 text-sm transition dark:bg-slate-950/40"
            >
              <span className="block text-xs tracking-[0.22em] uppercase opacity-60">Console</span>
              <span className="mt-1 block font-semibold">文章列表</span>
            </Link>
            <Link
              href="/admin/posts/new"
              className="border-ledger-border text-ledger-text hover:bg-ledger-accent-soft/40 rounded-[1.5rem] border bg-white/70 px-4 py-3 text-sm transition dark:bg-slate-950/40"
            >
              <span className="block text-xs tracking-[0.22em] uppercase opacity-60">Create</span>
              <span className="mt-1 block font-semibold">新建文章</span>
            </Link>
            <Link
              href="/blog"
              className="border-ledger-border text-ledger-text hover:bg-ledger-accent-soft/40 rounded-[1.5rem] border bg-white/70 px-4 py-3 text-sm transition dark:bg-slate-950/40"
            >
              <span className="block text-xs tracking-[0.22em] uppercase opacity-60">Frontend</span>
              <span className="mt-1 block font-semibold">查看前台</span>
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
