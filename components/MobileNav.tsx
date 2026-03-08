'use client'

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import { Fragment, useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from './Link'
import headerNavLinks from '@/data/headerNavLinks'

function isLinkActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(href)
}

const MobileNav = () => {
  const [navShow, setNavShow] = useState(false)
  const navRef = useRef(null)
  const pathname = usePathname()

  const onToggleNav = () => {
    setNavShow((status) => {
      if (status) {
        enableBodyScroll(navRef.current)
      } else {
        disableBodyScroll(navRef.current)
      }
      return !status
    })
  }

  useEffect(() => {
    return clearAllBodyScrollLocks
  })

  return (
    <>
      <button
        aria-label="打开导航"
        onClick={onToggleNav}
        className="ledger-btn ledger-btn-ghost text-ledger-text h-10 px-3 lg:hidden"
      >
        <span className="text-xs font-semibold tracking-[0.12em] uppercase">Menu</span>
      </button>
      <Transition appear show={navShow} as={Fragment} unmount={false}>
        <Dialog as="div" onClose={onToggleNav} unmount={false}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            unmount={false}
          >
            <div className="fixed inset-0 z-60 bg-black/45 backdrop-blur-[2px]" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="transition ease-out duration-220 transform"
            enterFrom="translate-y-4 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition ease-in duration-170 transform"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-4 opacity-0"
            unmount={false}
          >
            <DialogPanel className="border-ledger-border-strong bg-ledger-panel shadow-ledger-md fixed inset-x-4 top-4 z-70 max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border p-4 backdrop-blur">
              <div className="border-ledger-border mb-4 flex items-center justify-between border-b pb-3">
                <p className="ledger-kicker">Command Palette</p>
                <button
                  className="ledger-btn ledger-btn-ghost h-9 px-3"
                  aria-label="关闭导航"
                  onClick={onToggleNav}
                >
                  Close
                </button>
              </div>
              <nav ref={navRef} className="no-scrollbar max-h-[70vh] overflow-y-auto pr-1">
                <ul className="space-y-2">
                  {headerNavLinks.map((link) => {
                    const active = isLinkActive(pathname, link.href)
                    return (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          data-active={active ? 'true' : 'false'}
                          className="ledger-chip w-full justify-between px-3 py-3 text-sm"
                          onClick={onToggleNav}
                          aria-current={active ? 'page' : undefined}
                        >
                          <span>{link.title}</span>
                          <span className="opacity-70">{active ? 'active' : 'route'}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileNav
