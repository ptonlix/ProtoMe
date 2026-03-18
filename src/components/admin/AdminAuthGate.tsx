'use client'

import { useEffect, useState } from 'react'

const storageKey = 'protome-admin-key'

type AdminAuthGateProps = {
  children: (adminKey: string) => React.ReactNode
}

export default function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [adminKey, setAdminKey] = useState('')
  const [draftKey, setDraftKey] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const savedKey = window.localStorage.getItem(storageKey) || ''
    setAdminKey(savedKey)
    setDraftKey(savedKey)
    setReady(true)
  }, [])

  if (!ready) {
    return <div className="ledger-panel rounded-3xl border p-6">正在加载后台鉴权状态...</div>
  }

  if (!adminKey) {
    return (
      <div className="ledger-panel rounded-3xl border p-6">
        <h2 className="text-ledger-text text-xl font-semibold">管理员登录</h2>
        <p className="text-ledger-text-soft mt-2 text-sm">
          输入 `PROTOME_ADMIN_KEY` 后即可进入文件型写作后台。
        </p>
        <input
          type="password"
          value={draftKey}
          onChange={(event) => setDraftKey(event.target.value)}
          className="border-ledger-border mt-4 w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm dark:bg-slate-950/60"
          placeholder="请输入后台密钥"
        />
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(storageKey, draftKey.trim())
            setAdminKey(draftKey.trim())
          }}
          className="bg-ledger-accent mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white"
        >
          进入后台
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem(storageKey)
            setAdminKey('')
            setDraftKey('')
          }}
          className="text-ledger-text-soft hover:text-ledger-accent text-sm underline-offset-4 hover:underline"
        >
          退出后台
        </button>
      </div>
      {children(adminKey)}
    </div>
  )
}
