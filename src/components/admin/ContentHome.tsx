'use client'

import Link from 'next/link'
import AdminAuthGate from './AdminAuthGate'
import AdminShell from './AdminShell'
import { contentTypeOrder, getContentConfig } from './content-config'

export default function ContentHome() {
  return (
    <AdminAuthGate>
      {(adminKey, handleLogout) => (
        <AdminShell
          adminKey={adminKey}
          title="统一内容后台"
          description="在同一套工作台中管理 Blog、Profile、Projects、Authors、Worklogs 和 About。"
          onLogout={handleLogout}
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {contentTypeOrder.map((typeKey) => {
              const config = getContentConfig(typeKey)
              return (
                <Link
                  key={typeKey}
                  href={`/admin/content/${typeKey}`}
                  className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {config.navLabel}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {config.mode === 'singleton' ? '单例' : '集合'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {config.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-sm font-medium">
                    <span className="text-slate-500 dark:text-slate-400">
                      {config.mode === 'singleton' ? '直接编辑' : '查看列表'}
                    </span>
                    <span className="text-blue-600 dark:text-sky-300">进入</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </AdminShell>
      )}
    </AdminAuthGate>
  )
}
