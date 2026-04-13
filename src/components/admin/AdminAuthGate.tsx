'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from '@/components/Image'
import siteMetadata from '@/data/siteMetadata'

const storageKey = 'protome-admin-key'

type AdminAuthGateProps = {
  children: (adminKey: string, handleLogout: () => void) => React.ReactNode
}

export default function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [adminKey, setAdminKey] = useState('')
  const [draftKey, setDraftKey] = useState('')
  const [ready, setReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const savedKey = window.localStorage.getItem(storageKey) || ''
    setAdminKey(savedKey)
    setDraftKey(savedKey)
    setReady(true)
  }, [])

  const handleLogin = () => {
    const nextKey = draftKey.trim()
    window.localStorage.setItem(storageKey, nextKey)
    setAdminKey(nextKey)
  }

  const handleLogout = () => {
    window.localStorage.removeItem(storageKey)
    setAdminKey('')
    setDraftKey('')
    setShowPassword(false)
  }

  if (!ready) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white/85 p-8 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
            <Image src={siteMetadata.siteLogo} alt="ProtoMe logo" width={28} height={28} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            正在加载后台鉴权状态
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            正在检查本地保存的管理员密钥，请稍候。
          </p>
        </div>
      </div>
    )
  }

  if (!adminKey) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/70 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        <div
          className="absolute inset-0 opacity-70 dark:opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.16) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex min-h-[calc(100vh-8rem)] flex-col">
          <main className="flex flex-1 items-center justify-center p-6 md:p-8">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-2xl backdrop-blur-xl lg:grid-cols-2 dark:border-slate-800/80 dark:bg-slate-950/70">
              <section className="relative flex flex-col justify-center bg-white/65 p-8 sm:p-12 dark:bg-slate-950/55">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 shadow-inner dark:border-sky-500/20 dark:bg-sky-500/10">
                  <span className="text-2xl">🛡️</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  管理员登录
                </h1>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                  输入
                  <code className="mx-1 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    PROTOME_ADMIN_KEY
                  </code>
                  后即可进入文件型写作后台。
                </p>

                <form
                  className="mt-8 space-y-6"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleLogin()
                  }}
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="admin-access-key"
                      className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400"
                    >
                      后台密钥
                    </label>
                    <div className="group relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors group-focus-within:text-blue-500 dark:text-slate-500 dark:group-focus-within:text-sky-300">
                        <span className="text-lg">🔑</span>
                      </div>

                      <input
                        id="admin-access-key"
                        type={showPassword ? 'text' : 'password'}
                        value={draftKey}
                        onChange={(event) => setDraftKey(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 shadow-sm transition outline-none placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-sky-500/40 dark:focus:ring-sky-500/10"
                        placeholder="请输入管理员密钥..."
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((currentState) => !currentState)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        aria-label={showPassword ? '隐藏密钥' : '显示密钥'}
                      >
                        <span className="text-lg">{showPassword ? '🙈' : '👁️'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                  >
                    <span>进入后台</span>
                    <span>→</span>
                  </button>
                </form>
              </section>

              <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-900 p-12 lg:flex lg:items-center lg:justify-center">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl" />
                  <div className="absolute bottom-12 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
                </div>

                <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
                  <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-white/20">
                    <div className="absolute h-48 w-48 rounded-full border border-dashed border-white/30" />
                    <div className="flex h-32 w-32 rotate-12 items-center justify-center rounded-3xl border border-white/40 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
                      <Image
                        src={siteMetadata.siteLogo}
                        alt="ProtoMe logo"
                        width={88}
                        height={88}
                      />
                    </div>
                  </div>

                  <div className="mt-12 space-y-2 text-center">
                    <h2 className="text-xl font-bold tracking-wide text-white">ProtoMe Example</h2>
                    <p className="text-sm leading-relaxed text-blue-100/80">
                      公开仓库默认提供示例内容结构。
                      <br />
                      真实资料建议维护在私有工作区中。
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </main>

          <footer className="mx-auto w-full max-w-7xl px-6 pb-6">
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-400 backdrop-blur md:flex-row dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                  System Tailnote
                </span>
                <span>ProtoMe · © 2026 · Example Workspace Template</span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/about"
                  className="transition hover:text-slate-600 dark:hover:text-slate-300"
                >
                  关于
                </Link>
                <Link
                  href="/blog"
                  className="transition hover:text-slate-600 dark:hover:text-slate-300"
                >
                  博客
                </Link>
                <Link
                  href="/projects"
                  className="transition hover:text-slate-600 dark:hover:text-slate-300"
                >
                  项目
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    )
  }

  return <>{children(adminKey, handleLogout)}</>
}
