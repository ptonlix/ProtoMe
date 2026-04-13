'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Image from './Image'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'

function isLinkActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(href)
}

const Header = () => {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="sticky top-3 z-50 pb-4">
      <div
        className={`ledger-command-shell flex flex-wrap items-center justify-between gap-4 px-3 py-3 transition-all sm:px-4 ${
          isScrolled ? 'border-ledger-border-strong shadow-ledger-md' : 'border-ledger-border'
        }`}
      >
        <Link
          href="/"
          aria-label={siteMetadata.headerTitle}
          className="min-w-0 flex-1 sm:flex-none"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="border-ledger-border bg-ledger-panel-muted text-ledger-text rounded-xl border p-2">
              <Image src={siteMetadata.siteLogo} alt="ProtoMe logo" width={28} height={28} />
            </div>
            <div className="min-w-0">
              <p className="ledger-kicker">ProtoMe</p>
              {typeof siteMetadata.headerTitle === 'string' ? (
                <p className="ledger-heading truncate text-lg font-semibold">
                  {siteMetadata.headerTitle}
                </p>
              ) : (
                siteMetadata.headerTitle
              )}
            </div>
          </div>
        </Link>

        <nav
          className="no-scrollbar hidden max-w-full items-center gap-2 overflow-x-auto lg:flex"
          aria-label="主导航"
        >
          {headerNavLinks.map((link) => {
            const active = isLinkActive(pathname, link.href)
            return (
              <Link
                key={link.title}
                href={link.href}
                data-active={active ? 'true' : 'false'}
                className="ledger-chip"
                aria-current={active ? 'page' : undefined}
              >
                <span className="opacity-80">::</span>
                {link.title}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <SearchButton />
          <ThemeSwitch />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

export default Header
